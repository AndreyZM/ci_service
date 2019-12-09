import * as child_process from "child_process";
import * as fs from "fs";
import * as Slack from "slack";
import { config } from "../ci-config";
import { TaskStatus } from "./TaskStatus";
import { formatSlackUser } from "./utils/formatSlackUser";
import { RunTask } from "./BuildTaskServer";

let taskCounter: number = 0;
export abstract class BuildTask
{
	private promise: Promise<any>;
	protected runner: () => Promise<any>;

	public terminator?: () => void;
	public id: number = taskCounter++;
	public logPath?: string;
	public status: TaskStatus = "pending";
	public runUrl?: string;
	public runTask?: RunTask;
	public commits?: { author: string, branch: string, message: string, issues: string[] }[];
	public timings: {
		create: Date;
		start?: Date;
		end?: Date;
	} = { create: new Date() };

	constructor(public project: keyof typeof config.projects, public revision: string)
	{
		let projectConfig = config.projects[this.project];

		this.runner = async () =>
		{
			console.log(`[Task #${this.id}] running`);

			this.logPath = `/tasklog_${this.id}.log`;

			let log = `./www${this.logPath}`;
			if (fs.existsSync(log))
				fs.unlinkSync(log);

			this.timings.start = new Date();
			await this.updateRepo();

			await this.prepare();
			this.commits = parseHGCommits(fs.readFileSync(`${projectConfig.respositoryFolder}/commits.txt`, "utf8"));

			Slack.chat.postMessage({
				...config.slack,
				markdown: "true",
				text: `Build task \`#${this.id}\``,
				attachments: this.commits.map((c) =>
					({
						color: "#3AA3E3",
						markdown: "true",
						footer: `${c.branch} ${formatSlackUser(c.author)}`,
						text: `${replaceIssue(c.message, (issue) => `<${getIssueUrl(issue)}|${issue}>`)}`,
					})),
			}).then(console.log).catch(console.error);

			await this.build();

			this.timings.end = new Date();
		};
	}

	protected abstract prepare();
	protected abstract build();

	private async updateRepo()
	{
		await this.exec(`hg pull
		hg update -r ${this.revision} --clean
		hg clean --all
		hg log -r "ancestors(.) - ancestors(release)" -M --template "{author}:{branch}:{desc}:@@@:" > commits.txt`);
	}

	public stop()
	{
		if (this.terminator)
			this.terminator();
	}

	public async start()
	{
		if (this.status === "failed" || this.status === "completed")
			return;
		this.status = "running";
		try
		{
			await (this.promise || (this.promise = this.runner()));
		}
		catch (e)
		{
			console.error(e);
			console.log(`[Task #${this.id}] failed`);
			this.status = "failed";

			Slack.chat.postMessage({ ...config.slack, text: `Build failed Task #${this.id} ${this.project}/${this.revision}`});
			return;
		}

		this.status = "completed";
		console.log(`[Task #${this.id}] completed`);

		Slack.chat.postMessage({ ...config.slack, text: `Build complete Task #${this.id} ${this.project}/${this.revision}`});
	}

	protected exec(script: string)
	{
		let projectConfig = config.projects[this.project];
		let out = fs.openSync(`./www${this.logPath}`, "a");

		let p = child_process.exec(script,
			{
				cwd: projectConfig.respositoryFolder,
				maxBuffer: 50 * 1024 * 1024,
			});
		p.stdout.on("data", (chunk) => fs.appendFileSync(out, chunk));
		p.stderr.on("data", (chunk) => fs.appendFileSync(out, chunk));

		let process = wrap(p);
		this.terminator = () => process.terminate();
		return process.wait;
	}
}

export function parseHGCommits(input: string)
{
	let rx = /([^:]+?):([^:]+?):(.*?):@@@:/gi;
	let result = [];
	input.replace(rx, (value, author, branch, message) =>
	{
		let commit = { author, branch, message, issues: [] };
		replaceIssue(value, (issue) => (commit.issues.push(issue), issue));
		result.push(commit);
		return value;
	});
	return result.reverse();
}

export function replaceIssue(message: string, replacer: (issue: string) => string)
{
	let issueRx = /#([A-Za-z]+-[0-9]+)/gi;
	return message.replace(issueRx, (v, issue) => replacer(issue));
}

export function wrap(process: child_process.ChildProcess)
{
	return {
		wait: new Promise((r, reject) =>
		{
			if (process.killed)
				reject();
			process.on("exit", (code, signal) =>
			{
				console.log("Process Exit:", code);
				code === 0 ? r({ code, signal }) : reject({ code, signal })
			});
		}),
		terminate: () => process.kill(),
	};
}

export function getIssueUrl(issue: string)
{
	return `https://rockstonedev.atlassian.net/browse/${issue}`;
}
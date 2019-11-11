import * as child_process from "child_process";
import * as fs from "fs";
import * as Slack from "slack";
import { config } from "../ci-config";

export type TaskStatus = "pending" | "running" | "completed" | "failed";
export class BuildTask
{
	private runner: () => Promise<any>;
	private promise: Promise<any>;
	public terminator?: () => void;
	public id?: number;
	public logPath?: string;
	public status: TaskStatus = "pending";
	public runUrl: string = `https://m.inspin.me/test/${this.revision}`;
	public commits?: { author: string, branch: string, message: string }[];
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

			this.timings.start = new Date();
			Slack.chat.postMessage({ ...config.slack, text: `Start Task #${this.id} ${this.project}/${this.revision} <${this.logPath}|Log>` }).then(console.log).catch(console.error);

			await this.prepare();
			this.commits = parseHGCommits(fs.readFileSync(`${projectConfig.respositoryFolder}/commits.txt`, "utf8"));
			await this.build();

			this.timings.end = new Date();
		};
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

	private async prepare()
	{
		this.exec(`hg pull -r ${this.revision}
		hg update -r ${this.revision} --clean
		hg clean --all
		hg log -r "ancestors(.) - ancestors(release)" -M --template "{author}:{branch}\\n{desc}\\n@@@\\n" > commits.txt
		cat ../deploy.private.json > ./deploy/deploy.private.json
		mkdir ./BottleMobile/.tmp
		echo {} > ./BottleMobile/.tmp/spritegroups.json
		mkdir .tmp`);
	}

	private async build()
	{
		return this.exec(`cd ./BottleMobile
		cordova platform add ios android browser
		cordova prepare
		npm install
		cd ../deploy
		npm install
		gulp make -f gulp_deploy.js
		gulp default -f gulp_deploy.js --testname=test/${this.revision}`);
	}

	private exec(script: string)
	{
		let projectConfig = config.projects[this.project];
		let out = fs.openSync(`./www${this.logPath}`, "a");

		let p = child_process.exec(script,
			{
				cwd: projectConfig.respositoryFolder,
			});
		p.stdout.on("data", (chunk) => fs.appendFileSync(out, chunk));
		p.stderr.on("data", (chunk) => fs.appendFileSync(out, chunk));

		let process = wrap(p);
		this.terminator = () => process.terminate();
		return process.wait;
	}
}

function parseHGCommits(input: string)
{
	let rx = /([^:]+):([^\n]+)\n(.*?)\n@@@\n/gi;

	return rx.exec(input).map((value, index, params) => ({ author: params[0], branch: params[1], message: params[2] }));
}

function wrap(process: child_process.ChildProcess)
{
	return {
		wait: new Promise((r, reject) =>
		{
			process.on("exit", (code, signal) =>
			{
				console.log(code);
				code === 0 ? r({ code, signal }) : reject({ code, signal })
			});
		}),
		terminate: () => process.kill(),
	};
}
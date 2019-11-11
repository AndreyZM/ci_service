import * as child_process from "child_process";
import { config } from "../ci-config";

import * as Slack from "slack";

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export class BuildTask
{
	private runner: () => Promise<any>;
	public terminator: () => void;
	private promise: Promise<any>;
	public id?: number;
	public output: string = "";
	public status: TaskStatus = "pending";
	public artifacts: any;
	public timings: {
		create: Date;
		start?: Date;
		end?: Date;
	} = { create: new Date() };
	constructor(public project: keyof typeof config.projects, public revision: string)
	{
		let projectConfig = config.projects[project];
		this.runner = () => new Promise<string>((resolve, reject) =>
		{
			this.timings.start = new Date();
			Slack.chat.postMessage({ ...config.slack, text: `Start Task #${this.id} ${this.project}/${this.revision}`}).then(console.log).catch(console.error);

			let p = child_process.exec(projectConfig.scripts.repo_prepare(this.revision), { cwd: projectConfig.respositoryFolder, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) =>
			{
				this.timings.end = new Date();
				if (error)
				{
					console.error(error);
					reject(error);
					return;
				}
				this.output = stdout.toString();
				this.artifacts = projectConfig.scripts.collect_artifacts(this.revision);
				resolve(stdout.toString().trim());
			});
			this.terminator = () => p.kill();
			p.stdout.on("data", (chunk) =>
			{
				process.stdout.write(chunk);
				this.output += chunk;
			});
			p.stderr.on("data", (chunk) =>
			{
				process.stderr.write(chunk);
				this.output += chunk;
			});
		});
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
			console.log("Task failed");
			this.status = "failed";

			Slack.chat.postMessage({ ...config.slack, text: `Build failed Task #${this.id} ${this.project}/${this.revision}`});
			return;
		}

		this.status = "completed";
		console.log("Task completed");

		Slack.chat.postMessage({ ...config.slack, text: `Build complete Task #${this.id} ${this.project}/${this.revision}`});
	}
}

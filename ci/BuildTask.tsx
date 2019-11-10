import * as child_process from "child_process";
import { config } from "../ci-config";

export class BuildTask
{
	private runner: () => Promise<any>;
	private promise: Promise<any>;
	public id?: number;
	public output: string = "";
	public status: "pending" | "running" | "completed" | "failed" = "pending";
	public timings: {
		create: Date;
		start?: Date;
		end?: Date;
	} = { create: new Date() };
	constructor(public project: keyof typeof config.projects, public revision: string)
	{
		let c = config.projects[project];
		this.runner = () => new Promise<string>((resolve, reject) =>
		{
			this.timings.start = new Date();
			let p = child_process.exec(c.scripts.repo_prepare(this.revision), { cwd: c.respositoryFolder, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) =>
			{
				this.timings.end = new Date();
				if (error)
				{
					console.error(error);
					reject(error);
					return;
				}
				this.output = stdout.toString();
				resolve(stdout.toString().trim());
			});
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
		}
		this.status = "completed";
		console.log("Task completed");
	}
}

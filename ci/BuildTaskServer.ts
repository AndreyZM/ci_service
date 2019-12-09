import { config } from "../ci-config";
import { BuildTask, wrap } from "./BuildTask";
import * as child_process from "child_process";
import * as fs from "fs";

let taskCounter: number = 0;
export class BuildTaskServer extends BuildTask
{
	public runTask: RunTask;

	constructor(project: keyof typeof config.projects, revision: string)
	{
		super(project, revision);
	}

	protected async prepare()
	{
	}

	protected async build()
	{
		await this.exec(`make -j16 -f Makefile CONF=Debug
		mkdir mkdir -p ~/ci_artifacts/${this.project}/${this.revision}/${this.id}
		cp ./dist/Debug/GNU-Linux/* ~/ci_artifacts/${this.project}/${this.revision}/${this.id}
		cp ./config_debug.json ~/ci_artifacts/${this.project}/${this.revision}/${this.id}
		`);
		this.runTask = new RunTask(`~/ci_artifacts/${this.project}/${this.revision}/${this.id}/bottle`, `~/ci_artifacts/${this.project}/${this.revision}/${this.id}`, `/run_${this.id}.log`);
	}
}

export class RunTask
{
	public status: "ready" | "running" | "failed" | "stoped"= "ready";
	terminator: () => void;
	constructor(private command: string, private cwd: string, private logPath: string)
	{
		
	}

	public async start()
	{
		if (this.status == "running")
			return;

		this.status = "running";

		try
		{
			await this.exec(this.command);
			this.status = "ready";
		}
		catch (e)
		{
			console.log(e);
			this.status = "failed";
		}
		this.terminator = null;
	}

	public stop()
	{
		if (this.terminator)
			this.terminator();

		this.status = "stoped";
	}

	protected exec(script: string)
	{
		let out = fs.openSync(`./www${this.logPath}`, "a");

		let p = child_process.exec(script,
			{
				cwd: this.cwd,
				maxBuffer: 50 * 1024 * 1024,
			});
		p.stdout.on("data", (chunk) => fs.appendFileSync(out, chunk));
		p.stderr.on("data", (chunk) => fs.appendFileSync(out, chunk));

		let process = wrap(p);
		this.terminator = () => process.terminate();
		return process.wait;
	}
}
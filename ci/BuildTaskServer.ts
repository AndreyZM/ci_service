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
		this.runTask = new RunTask(`
		cd ~/ci_artifacts/${this.project}/${this.revision}/${this.id}
		~/ci_artifacts/${this.project}/${this.revision}/${this.id}/bottle`, `/run_${this.id}.log`);
	}
}

export class RunTask
{
	public status: "ready" | "running" | "failed" | "stoped" = "ready";
	terminator: () => void;
	constructor(private command: string, public logPath: string)
	{

	}

	public async start()
	{
		if (this.status == "running")
			return;

		this.status = "running";

		try
		{
			await this.spawn(this.command);
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

	protected spawn(script: string)
	{
		let log = `./www${this.logPath}`;
		if (fs.existsSync(log))
			fs.unlinkSync(log);
		let out = fs.openSync(log, "a");

		let p = child_process.exec(script,
			{
				maxBuffer: 300 * 1024 * 1024,
			}
		);
		
		p.stdout.on("data", (chunk) => fs.appendFileSync(out, chunk));
		p.stderr.on("data", (chunk) => fs.appendFileSync(out, chunk));

		let process = wrap(p);
		this.terminator = () => process.terminate();
		return process.wait;
	}
}
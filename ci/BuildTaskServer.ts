import { config } from "../ci-config";
import { BuildTask } from "./BuildTask";

let taskCounter: number = 0;
export class BuildTaskServer extends BuildTask
{
	public runUrl: string = `https://m.inspin.me/test/${this.revision}`;

	constructor(project: keyof typeof config.projects, revision: string)
	{
		super(project, revision);
	}

	protected async prepare()
	{
	}

	protected async build()
	{
		await this.exec(`make -j16 -f Makefile CONF=Debug`);
	}
}
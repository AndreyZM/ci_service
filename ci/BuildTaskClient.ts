import { config } from "../ci-config";
import { BuildTask } from "./BuildTask";

let taskCounter: number = 0;
export class BuildTaskClient extends BuildTask
{
	public runUrl: string = `https://m.inspin.me/test/${this.revision}`;
	constructor(project: keyof typeof config.projects, revision: string)
	{
		super(project, revision);
	}

	protected async prepare()
	{
		await this.exec(`cat ../deploy.private.json > ./deploy/deploy.private.json
		mkdir ./BottleMobile/.tmp
		echo {} > ./BottleMobile/.tmp/spritegroups.json
		mkdir .tmp`);
	}

	protected async build()
	{
		await this.exec(`cd ./BottleMobile
		cordova platform add ios android browser
		cordova prepare
		npm install
		cd ../deploy
		npm install
		gulp make -f gulp_deploy.js
		gulp default -f gulp_deploy.js --testname=test/${this.revision}`);
	}
}
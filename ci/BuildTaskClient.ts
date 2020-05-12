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
		cd ../BottleMobile
		npm run deploy@test`);
	}

	protected getActions()
	{
		return [
			{
				type: "button",
				text: "Run",
				url: this.runUrl,
			},
			{
				type: "button",
				text: "Run Test",
				url: this.runUrl + "?config=config_test",
			},
		]
	}
}
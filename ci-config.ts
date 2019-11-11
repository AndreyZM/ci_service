import * as fs from "fs";

export const config = {
	httpPort: 8080,
	httpsPort: 8081,
	slack: {
		token: atob("eG94cC0xODkwNDA2OTQ5MzMtMjI0MTI0MDc3OTIzLTgyODc4ODEzMTg2MC1jNzEwMTVmMGJmNTNhZTRhYmU1MTYxZjQzZTk3NzY3MA=="),
		channel: "#bot-test"
	},
	projects: {
		bottle_client_mobile: {
			repositoryUrl: "https://hg.rockstonecorp.com/bottle_client_mobile",
			respositoryFolder: "../bottle_client_mobile",

			scripts: {
				repo_prepare: (revision: string) => `
				hg pull -r ${revision}
				hg update -r ${revision} --clean
				hg clean --all
				cat ../deploy.private.json > ./deploy/deploy.private.json
				mkdir ./BottleMobile/.tmp
				echo {} > ./BottleMobile/.tmp/spritegroups.json
				mkdir .tmp
				cd ./BottleMobile
				cordova platform add ios android browser
				cordova prepare
				npm install
				cd ../deploy
				npm install
				gulp make -f gulp_deploy.js
				gulp default -f gulp_deploy.js --testname=test_${revision}
			`,
			}
		}
	}
}
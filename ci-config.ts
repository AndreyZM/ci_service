import * as fs from "fs";

let atob = require('atob');

export const config = {
	httpPort: 8080,
	httpsPort: 8081,
	slack: {
		token: atob("eG94cC0xODkwNDA2OTQ5MzMtMjI0MTI0MDc3OTIzLTgyODc4ODEzMTg2MC1jNzEwMTVmMGJmNTNhZTRhYmU1MTYxZjQzZTk3NzY3MA=="),
		channel: "#bot-test"
	},
	rhode: {
		webhook_key: "AJSfgh2hfHhuaA79",
	},
	projects: {
		bottle_client_mobile: {
			repositoryUrl: "https://hg.rockstonecorp.com/bottle_client_mobile",
			respositoryFolder: "../bottle_client_mobile",
		}
	}
};

function parseHGCommits(input: string)
{
	let rx = /([^:]+):([^\n]+)\n(.*?)\n@@@\n/gi;

	return rx.exec(input).map((value, index, params) => ({ author: params[0], branch: params[1], message: params[2] }));
}
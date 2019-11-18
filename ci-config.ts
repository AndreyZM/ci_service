import * as fs from "fs";

let atob = require("atob");

export const config = {
	httpPort: 8080,
	httpsPort: 8081,
	slack: {
		token: atob("eG94cC0xODkwNDA2OTQ5MzMtMjI0MTI0MDc3OTIzLTgyODc4ODEzMTg2MC1jNzEwMTVmMGJmNTNhZTRhYmU1MTYxZjQzZTk3NzY3MA=="),
		channel: "#bot-test"
	},
	rhode: {
		webhook_key: "AJSfgh2hfHhuaA79",
		host: "https://hg.rockstonecorp.com/_admin/api",
		key: "715b1a453c06558bab34646fee068ecf9aad3aa0"
	},
	projects: {
		bottle_client_mobile: {
			repositoryUrl: "https://hg.rockstonecorp.com/bottle_client_mobile",
			respositoryFolder: "../bottle_client_mobile"
		}
	},
	users: {
		MartynovViktor: "U6G0S7K29",
		andrey: "U6L3N29T5",
		jay_go: "U6FQU50ES",
		kolya7k: "U5JB4ETB3",
		ekaterina_kondratieva: "UJ4PK0QUE",
		injectiondkp735: "U6SS17TJB"
	}
}

function parseHGCommits(input: string)
{
	let rx = /([^:]+):([^\n]+)\n(.*?)\n@@@\n/gi;

	return rx.exec(input).map((value, index, params) => ({ author: params[0], branch: params[1], message: params[2] }));
}
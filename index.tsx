import * as child_process from "child_process";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { config } from "./ci-config";
import { htmlPage } from "./web/Html";
import { RootPage } from "./web/RootPage";

let privateKey  = fs.readFileSync("./certs/key.pem", "utf8");
let certificate = fs.readFileSync("./certs/cert.pem", "utf8");

let app = express();

let httpServer = http.createServer(app);
let httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

let staticConfig = {
	maxAge: "1y"
};

app.get("/", (req, res) =>
{
	let component = <RootPage />;
	res.send(htmlPage(ReactDOMServer.renderToString(component), {lang: "ru"}));
});

interface ITask
{
	output: string;
	runner: () => Promise<void>;

	id?: number;
}

let tasks: BuildTask[] = [];

async function runTask(task: BuildTask)
{
	let id = tasks.push(task);
	for (let t of tasks)
		await t.start();
	console.log("Task queue is empty");
}

app.get("/build", (req, res) =>
{
	console.log(req.params);
	runTask(new BuildTask("bottle_client_mobile", "default"));
});

httpServer.listen(config.httpPort);
httpsServer.listen(config.httpsPort);

function execS(cmd, opt) {
	return new Promise<string>((resolve, reject) =>
	{
		let p = child_process.exec(cmd, { ...opt, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) =>
		{
			if (error)
			{
				console.error(error);
				reject(error);
				return;
			}
			console.log(stdout);
			resolve(stdout.toString().trim());
		});

		p.stdout.on("data", (chunk) => process.stdout.write(chunk));
		p.stderr.on("data", (chunk) => process.stderr.write(chunk));
	});
}

export class BuildTask
{
	private runner: () => Promise<any>;
	private promise: Promise<any>;
	private status: "pending" | "running" | "completed" | "failed" = "pending";
	constructor(public project: keyof typeof config.projects, public revision: string)
	{
		let c = config.projects[project];
		this.runner = () => execS(c.scripts.repo_prepare(this.revision), { cwd: c.respositoryFolder });
	}

	public async start()
	{
		if (this.status == "failed" || this.status == "completed")
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
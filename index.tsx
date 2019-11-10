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

import { BuildTask } from "./ci/BuildTask";
import { TaskList } from "./ci/TaskList";

let privateKey  = fs.readFileSync("./certs/key.pem", "utf8");
let certificate = fs.readFileSync("./certs/cert.pem", "utf8");

let app = express();

let httpServer = http.createServer(app);
let httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

app.get("/", (req, res) =>
{
	let component = <RootPage />;
	res.send(htmlPage(ReactDOMServer.renderToString(component), {lang: "ru"}));
});

const tasks = new TaskList();

app.get("/build", (req, res) =>
{
	let project = req.params.project as any || "bottle_client_mobile";
	let revision = req.params.revision || "default";

	let task = tasks.runTask(new BuildTask(project, revision));
	res.send({ taskId: task.id });
});

app.get("/tasklist", (req, res) =>
{
	let filters: ((t: BuildTask) => boolean)[] = [];

	if (req.params.ids)
	{
		let ids = req.params.ids.split(",").map((id) => id as any | 0);
		filters.push((task) => ids.some((id) => id === task.id));
	}

	if (req.params.status)
		filters.push((task) => task.status === req.params.status);

	res.send({ tasks: tasks.tasks.filter((task) => filters.every((f) => f(task))) });
});

httpServer.listen(config.httpPort);
httpsServer.listen(config.httpsPort);
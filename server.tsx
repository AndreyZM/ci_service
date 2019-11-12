import * as cors from "cors";
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import { config } from "./ci-config";

import { ServerCI } from "./ServerCI";

let privateKey  = fs.readFileSync("./certs/key.pem", "utf8");
let certificate = fs.readFileSync("./certs/cert.pem", "utf8");

let app = express();

let apiRouter = express.Router();
let httpServer = http.createServer(app);
let httpsServer = https.createServer({key: privateKey, cert: certificate}, app);

const ciServer = new ServerCI();

makeRouter(ciServer, apiRouter);

app.use("/api", apiRouter);

app.use(express.static("./www", {lastModified: false}));

app.post("/webhook/rhode", (req, res) =>
{
	console.log(req.query, req.body);
	switch (req.query.event_name)
	{
		case "repo-push":
			if (req.query.repo_name in config.projects && req.query.branch)
				ciServer.build({ project: req.query.repo_name, revision: req.query.branch });
			break;
		default:
			break;
	}
	res.send({});
});

httpServer.listen(config.httpPort);
httpsServer.listen(config.httpsPort);

function makeRouter(target: any, router: express.Router)
{
	let descriptors = Object.getOwnPropertyDescriptors(target.constructor.prototype);

	Object.entries(descriptors).forEach((e) =>
	{
		let [ name, descriptor ] = e;
		if (name === "constructor")
			return;

		if (typeof descriptor.value === "function")
		{
			console.log(`Bind: ${name}`);
			let func = descriptor.value.bind(target);
			router.get("/" + name, (req, res, next) =>
			{
				res.send(func(req.query));
			});
		}
	})
}
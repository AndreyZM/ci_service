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

apiRouter.get("/build", (req, res) =>
{
	res.send(ciServer.build(req.query));
});

apiRouter.get("/tasklist", (req, res) =>
{
	res.send(ciServer.tasklist(req.query));
});

app.use("/api", apiRouter);

app.use(express.static("./www", { maxAge: "1y" }));
httpServer.listen(config.httpPort);
httpsServer.listen(config.httpsPort);
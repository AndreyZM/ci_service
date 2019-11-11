let child_process = require("child_process");
let prc = child_process.exec("ts-node server.tsx");
prc.stdout.on("data", (chunk) => process.stdout.write(chunk));
prc.stderr.on("data", (chunk) => process.stderr.write(chunk));

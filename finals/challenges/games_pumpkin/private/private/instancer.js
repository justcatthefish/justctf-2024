import { execSync } from "child_process";
import recaptcha from "./recaptcha.js";
import express from "express";
import { readFileSync } from "fs";
import crypto from 'crypto'
import './proxy.js'

const sitekey = readFileSync("./gcp/domain.key", "utf8");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

export const runningDockers = {};

const instanceTimeoutInMs = 30 * 60 * 1000;


const runDocker = async (
	yaml = "./challenge/docker-compose.yml"
) => {
	const id = Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString('hex')
	const command = `UID=${id} docker compose -f ${yaml} -p ${id} up -d`;
	runningDockers[id] = {
		id,
		timeout: setTimeout(() => {
			console.log(`Instance ${id} timed out.`);
			stopDocker(id);
		}, instanceTimeoutInMs),
	};
	execSync(command);
	return id;
};

const stopDocker = (
	id,
	yaml = "./challenge/docker-compose.yml"
) => {
	const command = `docker compose -f ${yaml} -p ${id} down`;
	execSync(command);
	delete runningDockers[id];
};

app.post("/api/run", recaptcha, async (req, res) => {
	try {
		var id = await runDocker();
		return res.send({
			success: true,
			id,
			lifespan: instanceTimeoutInMs,
		});
	} catch (e) {
		return res.send({
			success: false,
			message: e.message,
		});
	}
});

app.get("/", (req, res) => {
	res.render("index", { sitekey });
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});



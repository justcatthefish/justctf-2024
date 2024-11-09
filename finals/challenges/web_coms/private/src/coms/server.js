const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());

app.use(express.static("static"));

const performTask = async (data) => {
	const res = await fetch("http://ship/task", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!res.ok) {
		throw new Error("Please contact the admin. Something went wrong.");
	}
	const result = await res.text();
	return result;
};

const invalidWires = (wires) => {
	return wires.length !== 20 || wires.some((w) => w.length !== 8);
};

const invalidShips = (ships) => {
	return (
		ships.length !== 20 ||
		ships.some((s) => Object.keys(s).length !== 2) ||
		ships.some((s) => typeof s["ship"] !== "string") ||
		ships.some((s) => typeof s["correct"] !== "boolean")
	);
};

const invalidPasscode = (passcode) => {
	return typeof passcode !== "string" || passcode.length > 4;
};

app.post("/task", async (req, res) => {
	try {
		const { taskData } = req.body;
		if (!taskData) {
			throw new Error("Invalid request - no task data provided");
		}
		const { wires, ships, passcode } = taskData;
		if (!wires || !ships || !passcode) {
			throw new Error(
				"Invalid request - missing wires, ships or passcode data"
			);
		}
		if (invalidWires(wires)) {
			throw new Error("Invalid request - invalid wires data");
		}
		if (invalidShips(ships)) {
			throw new Error("Invalid request - invalid ships data");
		}
		if (invalidPasscode(passcode)) {
			throw new Error("Invalid request - invalid passcode data");
		}

		const result = await performTask(taskData);
		return res.json({
			success: true,
			message: result,
		});
	} catch (e) {
		return res.json({
			success: false,
			message: e.message,
		});
	}
});

app.listen(3000, () => {
	console.log("Coms server started: http://localhost:3000");
});

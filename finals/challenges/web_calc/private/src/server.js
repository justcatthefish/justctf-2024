const express = require("express");
const report = require("./adminbot.js");

var app = express();


app.use(express.static("static"));

app.post(
	"/report",
	(req, res) => {
		const { url } = req.query ?? "";

		if (!url.match(/^http\:\/\/localhost:3000\/\?code=/)) {
			res.end("Invalid url!");
			return;
		}
		report(url);
		res.end(`Visiting url ${url}!`);
		return;
	}
);

app.listen(3000);
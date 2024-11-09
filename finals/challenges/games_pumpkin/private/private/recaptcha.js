import { readFileSync } from "fs";

const privateKey = readFileSync("./gcp/private.key", "utf8");

const verifyToken = async (token) => {
	const body = new URLSearchParams();
	body.append("secret", privateKey);
	body.append("response", token);
	const response = await fetch(
		"https://www.google.com/recaptcha/api/siteverify",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		}
	);

	const { success } = await response.json();
	if (!success) {
		throw new Error("Invalid captcha token.");
	}
};

export default async (req, res, next) => {
	try {
		const { token } = req.body;
		if (!token || typeof token !== "string") {
			return res.send({
				success: false,
				message: "No token provided.",
			});
		}
		await verifyToken(token);
		return next();
	} catch (err) {
		return res.json({
			success: false,
			message: err.message ?? "Something went wrong.",
		});
	}
};

const express = require("express");
const bodyParser = require("body-parser");
const zod = require("zod");

const questions = [
	{
		id: 1,
		text: "What are typical web security vulnerabilities?",
		answers: [
			{
				text: "Cross-site scripting (XSS), SQL injection, Insecure Direct Object Reference (IDOR)",
				correct: true,
			},
			{
				text: "Buffer Overflow, Use After Free (UAF), Format String Vulnerability",
				correct: false,
			},
			{
				text: "Broken Algorithms, Padding Oracle Attack, Reusing Nonces or Keys",
				correct: false,
			},
		],
	},
	{
		id: 2,
		text: "How can you prevent SQL injection?",
		answers: [
			{
				text: "Use prepared statements or parameterized queries",
				correct: true,
			},
			{
				text: "Using raw string interpolation or concatenation",
				correct: false,
			},
			{
				text: "Use a Content Security Policy (CSP)",
				correct: false,
			},
		],
	},
	{
		id: 3,
		text: "What is a Content Security Policy (CSP)?",
		answers: [
			{
				text: "Name of an HTTP response header that moden browsers use to restrict which resources can be loaded",
				correct: true,
			},
			{
				text: "A policy document, usually in PDF document, that describes the security policy of a company",
				correct: false,
			},
			{
				text: "Ruleset that restricts unsafe SQL or NoSQL queries",
				correct: false,
			},
		],
	},
	{
		id: 4,
		text: "What is Burp Suite?",
		answers: [
			{
				text: "A tool for mainly analyzing and repeating HTTP and Websocket traffic via a proxy",
				correct: true,
			},
			{
				text: "Cryptographic algorithm that stands behind RSA acronym",
				correct: false,
			},
			{
				text: "A bar game that is played in elegant pubs",
				correct: false,
			},
		],
	},
];
const totalQuestions = 100;

const userAnswersSchema = zod.object({
	answers: zod.array(
		zod.object({
			answer: zod.string(),
			questionId: zod.number(),
		})
	),
	hash: zod.string(),
});
const flag = process.env.FLAG;
if (!flag) {
	throw new Error("No flag found in environment variables");
}

const md5 = (str) => {
	return require("crypto").createHash("md5").update(str).digest("hex");
};

const isQuizCorrect = (userAnswers) => {
	return userAnswers.every((userAnswer) => {
		const question = questions.find(
			(question) => question.id === userAnswer.questionId
		);
		if (!question) {
			return false;
		}
		const correctAnswer = question.answers.find(
			(answer) => answer.text === userAnswer.answer
		);
		return correctAnswer?.correct ?? false;
	});
};

const app = express();

app.use(express.static("static"));
app.use(bodyParser.json());

app.post("/submit", (req, res) => {
	try {
		const { success, error, data } = userAnswersSchema.safeParse(req.body);
		if (!success) {
			return res.json({ message: error.message });
		}
		let isUserTryingToCheat = false;
		const { answers, hash } = data;
		if (md5(JSON.stringify(answers)) !== hash) {
			isUserTryingToCheat = true;
		}
		if (answers.length !== totalQuestions) {
			isUserTryingToCheat = true;
		}
		if (isUserTryingToCheat) {
			return res.json({ message: "don't try anything fishy!!" });
		}
		if (isQuizCorrect(answers)) {
			return res.json({ message: flag });
		} else {
			return res.json({ message: "You have failed the quiz!" });
		}
	} catch (error) {
		res.status(400).json({ message: "Something went wrong." });
	}
});

app.get("/questions.json", (req, res) => {
	res.json({ questions, count: totalQuestions });
});

app.listen(3000);

let questions = [];
let numberOfQuestions = 0;
let userAnswers = [];

const getQuestions = async () => {
	const response = await fetch("/questions.json");
	const { questions: questionsData, count } = await response.json();
	questions = questionsData;
	numberOfQuestions = count;
};

const getRandomQuestion = () => {
	const idx = Math.floor(Math.random() * questions.length);
	const question = JSON.parse(JSON.stringify(questions[idx]));
	question.answers.sort(() => Math.random() - 0.5);
	return question;
};

const buildQuestion = (question, num, total) => {
	const questionDiv = document.getElementById("question-div");
	questionDiv.innerHTML = "";
	const questionText = document.createElement("h2");
	questionText.innerText = `${num + 1} / ${total}. ${question.text}`;
	questionDiv.appendChild(questionText);
	for (let i = 0; i < question.answers.length; i++) {
		const answer = question.answers[i];
		const answerDiv = document.createElement("div");
		const radio = document.createElement("input");
		radio.type = "radio";
		radio.name = "answer";
		radio.value = answer.text;
		radio.id = `answer-${i}`;
		const label = document.createElement("label");
		label.innerText = answer.text;
		answerDiv.appendChild(radio);
		answerDiv.appendChild(label);
		questionDiv.appendChild(answerDiv);
	}
	if (num + 1 === total) {
		document.getElementById("next-button").innerText = "Submit";
	}
};

const getAnswer = () => {
	const answer = document.querySelector('input[name="answer"]:checked');
	if (answer) {
		return answer.value;
	}
	return null;
};

document.addEventListener("DOMContentLoaded", async () => {
	await getQuestions();
	const userQuestions = Array.from({ length: numberOfQuestions }).map(
		getRandomQuestion
	);
	let currentQuestionIdx = 0;

	document.getElementById("next-button").addEventListener("click", async () => {
		const userAnswer = getAnswer();
		if (!userAnswer) {
			alert("Please select an answer");
			return;
		}
		userAnswers.push({
			answer: userAnswer,
			questionId: userQuestions[currentQuestionIdx].id,
		});
		currentQuestionIdx++;
		if (currentQuestionIdx >= userQuestions.length) {
			const response = await fetch("/submit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					answers: userAnswers,
					hash: CryptoJS.MD5(JSON.stringify(userAnswers)).toString(),
				}),
			});
			const result = await response.json();
			alert(result.message);
			return;
		}
		buildQuestion(
			userQuestions[currentQuestionIdx],
			currentQuestionIdx,
			userQuestions.length
		);
	});

	buildQuestion(
		userQuestions[currentQuestionIdx],
		currentQuestionIdx,
		userQuestions.length
	);
});

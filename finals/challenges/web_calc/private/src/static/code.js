function validateCalculation(calculation) {
	if (
		calculation.type == "BinaryExpression" ||
		calculation.type == "LogicalExpression"
	) {
		validateCalculation(calculation.left);
		validateCalculation(calculation.right);
	} else if (calculation.type == "Literal") {
		if (typeof calculation.value != "number") {
			throw "Expected number Literal got: " + typeof calculation.value;
		}
	} else if (calculation.type == "Identifier") {
		validateIdentifier(calculation);
	} else {
		throw "Invalid calculation type: " + calculation.type;
	}
}

function validateIdentifier(identifier) {
	if (identifier.type != "Identifier") {
		throw "Expected type Identifier found: " + identifier.type;
	}
	if (identifier.name.length > 2) {
		throw "Invalid Identifier name: " + identifier.name;
	}
}

function validateExpression(expression) {
	if (expression.type != "AssignmentExpression") {
		throw (
			"Invalid Expression, expected AssignmentExpression got: " +
			expression.type
		);
	}
	validateIdentifier(expression.left);
	validateCalculation(expression.right);
}

function validateProgram(program) {
	for (var statement of program.body) {
		if (statement.type != "ExpressionStatement") {
			throw "Invalid Program";
		}
		validateExpression(statement.expression);
	}
}

function transformAST(program) {
	for (var expressionStatement of program.body) {
		expressionStatement.expression = {
			"type": "CallExpression",
				"callee": {
				"type": "Identifier",
				"name": "log"
				},
			"arguments": [{
				"type": "Literal",
				"value": expressionStatement.expression.left.name,
			  }, expressionStatement.expression]
		}
	}
	return program;
}

document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("btn").onclick = function () {
		runCode(document.getElementById("code").value);
	};

	var params = new URLSearchParams(document.location.search);
	var code = params.get("code");
	if (code) {
		document.getElementById("code").value = code;
		runCode(code);
	}
});

function log(variable, value) {
	var element = document.createElement("code")
	element.innerText = `${variable} = ${value}`
	document.getElementById("output").appendChild(document.createElement("br"))
	document.getElementById("output").appendChild(element)
}

function runCode(code) {
	var params = new URLSearchParams();
	params.set("code", code);
	window.history.replaceState({}, "", "?" + params);
	var AST = esprima.parse(code);
	document.getElementById("output").innerHTML = "Results:"
	try {
		validateProgram(AST);
		var newAST = transformAST(AST)
		eval(escodegen.generate(newAST))
	} catch (e) {
		document.getElementById("output").innerText = e;
	}
}

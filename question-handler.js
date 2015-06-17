var templates = require('./equation_templates.json');

String.prototype.replaceAt = function (index, character) {
	return this.substr(0, index) + character + this.substr(index + 1);
}

function shuffle(array) {
	var counter = array.length,
		temp, index;

	// While there are elements in the array
	while (counter > 0) {
		// Pick a random index
		index = Math.floor(Math.random() * counter);

		// Decrease counter by 1
		counter--;

		// And swap the last element with it
		temp = array[counter];
		array[counter] = array[index];
		array[index] = temp;
	}

	return array;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNum(from, to, excluding) {
	while (true) {
		var num = Math.round(Math.random() * (to - from) + from);
		if (excluding.indexOf(num) == -1) return num;
	}
}

function makeOptions(eq) {
	console.log(eq);
	var vysledek = eval(eq);
	var options = [vysledek];
	var from = vysledek - 5;
	var to = vysledek + 5;
	for (var i = 0; i < 3; i++) {
		options.push(generateNum(from, to, options));
	}
	options = shuffle(options);

	return {
		question: eq + " = ?",
		options: options,
		answer: vysledek
	}
}

function templatedEquationGenerator() {
	var template;
	var vysledek = 0.465465434;
	while (vysledek % 0.5 != 0 || vysledek < -100 || vysledek > 100) {
		template = templates[getRandomInt(0, templates.length - 1)];
		while (true) {
			var index = template.indexOf('$');
			if (index == -1) break;

			var num = getRandomInt(2, 30);
			template = template.replaceAt(index, num);
		}

		vysledek = eval(template);
	}
	console.log("out", template, vysledek);
	return makeOptions(template);
}

function simpleEquationGenerator() {
	var vysledek = 1000;
	var a = 0;
	var b = 0;
	var znameko = "+";

	while (vysledek > 100 || vysledek % 1 != 0) {
		a = Math.round(Math.random() * 100 + 1);
		b = Math.round(Math.random() * 100 + 1);
		znamenko = Math.random() > 0.5 ? "+" : "-";

		vysledek = eval(a + znameko + b);
	}

	return makeOptions(a + " " + znameko + " " + b);
}

var generators = [
	templatedEquationGenerator
];

module.exports = function () {
	return generators[Math.floor(Math.random() * generators.length)]();
}
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

function generateNum(from, to, excluding) {
	while (true) {
		var num = Math.round(Math.random() * (to - from) + from);
		if (excluding.indexOf(num) == -1) return num;
	}
}

function simpleEquationGenerator() {
	var vysledek = 1000;
	var a = 0;
	var b = 0;
	var znameko = "+";

	while (vysledek > 100 || vysledek < 0 || vysledek % 1 != 0) {
		a = Math.round(Math.random() * 100 + 1);
		b = Math.round(Math.random() * 100 + 1);
		znamenko = Math.random() > 0.5 ? "+" : "-";

		vysledek = eval(a + znameko + b);
	}

	var options = [vysledek];
	var from = vysledek - 5;
	var to = vysledek + 5;
	for (var i = 0; i < 3; i++) {
		options.push(generateNum(from, to, options));
	}
	options = shuffle(options);

	return {
		question: a + " " + znameko + " " + b + " = ?",
		options: options,
		answer: vysledek
	}
}

var generators = [
	simpleEquationGenerator
];

module.exports = function () {
	return generators[Math.floor(Math.random() * generators.length)]();
}
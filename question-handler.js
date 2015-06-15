function generate() {
	return "2 + 5 = ?"; //TODO
}

function validate(question, answer) {
	return answer == "7"; //TODO
}

module.exports = {
	generate: generate,
	validate: validate
}
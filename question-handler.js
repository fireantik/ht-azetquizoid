function generate() {
	return "2 + 5 = ?";
}

function validate(question, answer) {
	return answer == "7";
}

module.exports = {
	generate: generate,
	validate: validate
}
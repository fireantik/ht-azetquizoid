var helpers = require('./helpers.js');
var questions = require('./question-handler.js');
var images_file = require('./db_generator/parse.js');
var imageDB = images_file.items;
var imageOptions = images_file.names;

var correct_answer_score = 5;
var wrong_answer_score = 0;
var first_answer_score = 5;
var correct_guess_score = 20;
var wrong_guess_score = -10;

var question_time = 60000;

function Game(ws, closeCallback) {
	this.closeCallback = closeCallback;

	this.client1 = ws;
	this.client2 = null;

	this.state = "awaiting";
	this.id = makeId();
	this.image = imageDB[Math.floor(Math.random() * imageDB.length)];
	this.options = getRandomOptions(20, this.image.name);
	this.size = {
		x: 10,
		y: 10
	};
	this.time_create = Date.now();
	this.time_start = null;
	this.time_end = null;
	this.client1_score = 0;
	this.client2_score = 0;

	this.question = null;
	this.question_timestamp = null;
	this.question_answer_time = question_time;
	this.question_timeout = null;

	this.client1_answer = null;
	this.client1_answer_timestamp = null;
	this.client2_answer = null;
	this.client2_answer_timestamp = null;

	this.client1_picking = false;
	this.client2_picking = false;

	this.uncovered = [];

	for (var y = 0; y < this.size.y; y++) {
		this.uncovered[y] = [];
		for (var x = 0; x < this.size.x; x++) {
			this.uncovered[y][x] = false;
		}
	}
}

Game.prototype.serialize = function () {
	return {
		state: this.state,
		id: this.id
	}
}

Game.prototype.close = function () {
	if (this.state == "closed") return;
	clearTimeout(this.question_timeout);
	if (this.client1) this.client1.close();
	if (this.client2) this.client2.close();
	this.state = "closed";
	this.closeCallback(this);
	helpers.logDebug("closed", this.id);
}

Game.prototype.start = function (ws2) {
	this.client2 = ws2;
	this.state = "active";

	var conConfirm = helpers.message("connect-confirm", {
		id: this.id,
		img_url: this.image.url,
		img_width: this.image.width,
		img_height: this.image.height,
		options: this.options,
		size: this.size
	});

	this.broadcast(conConfirm);

	helpers.logDebug("game", this.id, "started");

	this.newQuestion();
	this.broadcast_status_report();
}

Game.prototype.message = function (type, data, ws) {
	var item = this["message_" + type];
	if (typeof (item) == "function") item.call(this, data, ws);
	else this.wsSend(ws, helpers.error("invalid command"));
}

Game.prototype.message_status = function (data, ws) {
	this.wsSend(ws, helpers.message("status-report", this.serialize()));
}

Game.prototype.message_answer = function (data, ws) {
	if (!data.text) {
		this.wsSend(ws, helpers.error("no answer text supplied"));
		return;
	}

	var answer = data.text;
	if (ws == this.client1) this.someone_answered(1, answer);
	else this.someone_answered(2, answer);
}

Game.prototype.message_select = function (data, ws) {
	if (ws == this.client1 && !this.client1_picking) return;
	if (ws == this.client2 && !this.client2_picking) return;

	var x = data.x;
	var y = data.y;

	if (x < 0 || y < 0 || x >= this.size.x || y >= this.size.y) {
		this.wsSend(ws, helpers.error("invalid position selected"));
		return;
	}

	this.uncoverCell(x, y);
	this.donePicking();
}

Game.prototype.message_guess = function (data, ws) {
	var correct = data.text == this.image.name;

	var response = helpers.message("guess-response", {
		correct: correct
	});

	this.wsSend(ws, response);

	if (!correct) {
		if (ws == this.client1) this.client1_score += wrong_guess_score;
		else this.client2_score += wrong_guess_score;
		return;
	}

	this.state = "ended";

	if (ws == this.client1) this.client1_score += correct_guess_score;
	else this.client2_score += correct_guess_score;

	this.broadcast_status_report();
	this.close();
}

Game.prototype.someone_answered = function (who, what) {
	if (who == 1) {
		this.client1_answer = what;
		this.client1_answer_timestamp = Date.now();
	} else {
		this.client2_answer = what;
		this.client2_answer_timestamp = Date.now();
	}

	helpers.logDebug("client", who, "answered", what);

	if (this.client1_answer && this.client2_answer) this.questionEnded();
}

Game.prototype.broadcast_status_report = function () {
	var report = this.makeStatusReport();
	this.broadcast(report);
}

Game.prototype.broadcast = function (message) {
	this.wsSend(this.client1, message);
	this.wsSend(this.client2, message);
}

Game.prototype.makeStatusReport = function () {
	return helpers.message("status-report", {
		player1score: this.client1_score,
		player2score: this.client2_score,
		"options": this.options,
		"state": this.state,
		"question": this.question.question,
		"question_options": this.question.options,
		"uncovered": this.uncovered
	});
}

Game.prototype.newQuestion = function () {
	if (this.state == "closed") return;

	this.client1_answer = null;
	this.client1_answer_timestamp = null;
	this.client2_answer = null;
	this.client2_answer_timestamp = null;
	this.question = questions();
	this.question_timestamp = Date.now();
	var a = this;
	this.question_timeout = setTimeout(function () {
		if (this.state != "closed") Game.prototype.questionEnded.call(a);
	}, this.question_answer_time);

	var qmsg = helpers.message("question", {
		"text": this.question.question,
		"question_options": this.question.options,
		"timestamp": this.question_timestamp,
		"answer_time": this.question_answer_time
	});
	this.broadcast(qmsg);
}

Game.prototype.uncoverCell = function (x, y) {
	helpers.logDebug("uncovering", x, y);
	this.uncovered[y][x] = true;
}

Game.prototype.pickRandomCell = function () {
	while (true) {
		var x = Math.floor(Math.random() * this.size.x);
		var y = Math.floor(Math.random() * this.size.y);

		if (this.uncovered[y][x]) continue;

		return {
			x: x,
			y: y
		}
	}
}

Game.prototype.questionEnded = function () {
	helpers.logDebug(this.id, "question ended");

	clearTimeout(this.question_timeout);
	this.question_timeout = null;

	var c1correct = this.client1_answer == this.question.answer;
	var c2correct = this.client2_answer == this.question.answer;



	if (!c1correct && !c2correct) {
		var cell = this.pickRandomCell();
		this.uncoverCell(cell.x, cell.y);
	} else if (c1correct && !c2correct) {
		this.client1_picking = true;
	} else if (!c1correct && c2correct) {
		this.client2_picking = true;
	} else {
		if (this.client1_answer_timestamp < this.client2_answer_timestamp) this.client1_picking = true;
		else this.client2_picking = true;
	}

	var c1report = {
		correct: c1correct,
		pick: this.client1_picking
	};

	var c2report = {
		correct: c2correct,
		pick: this.client2_picking
	};

	this.client1_score += c1report.correct ? correct_answer_score : wrong_answer_score;
	this.client1_score += c1report.pick ? first_answer_score : 0;
	this.client2_score += c2report.correct ? correct_answer_score : wrong_answer_score;
	this.client2_score += c2report.pick ? first_answer_score : 0;

	this.wsSend(this.client1, helpers.message("answer-report", c1report));
	this.wsSend(this.client2, helpers.message("answer-report", c2report));

	if (!c1correct && !c2correct) this.donePicking();
}

Game.prototype.donePicking = function () {
	this.broadcast_status_report();
	this.newQuestion();
}

Game.prototype.wsSend = function (where, what) {
	if (this.state == "closed") return;
	if (!where) {
		this.close();
		return;
	}
	where.send(what);
}

function makeId() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (var i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function getRandomOptions(count, included) {
	var opts = imageOptions.slice();
	opts.filter(function (a) {
		return a != included;
	}).sort(function (a) {
		return 0.5 - Math.random();
	});
	var sliced = opts.slice(0, count - 1);
	sliced.push(included);
	return sliced;
}

function bootstrap() {

}

bootstrap();
module.exports = Game;
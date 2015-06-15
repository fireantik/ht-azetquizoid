var helpers = require('./helpers.js');
var questions = require('./question-handler.js');
var images_file = require('./images_db.json');
var imageDB = [];
var imageOptions = [];


function Game(ws) {
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
	this.question_answer_time = 5000;
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
	if (this.question_timeout) clearTimeout(this.question_timeout);
	if (this.client1) this.client1.close();
	if (this.client2) this.client2.close();
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

	console.log("game", this.id, "started");

	this.newQuestion();
	this.broadcast_status_report();
}

Game.prototype.message = function (type, data, ws) {
	var item = this["message_" + type];
	if (typeof (item) == "function") item.call(this, data, ws);
	else ws.send(helpers.error("invalid command"));
}

Game.prototype.message_status = function (data, ws) {
	ws.send(helpers.message("status-report", this.serialize()));
}

Game.prototype.message_answer = function (data, ws) {
	if (!data.text) {
		ws.send(helpers.error("no answer text supplied"));
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
		ws.send(helpers.error("invalid position selected"));
		return;
	}

	this.uncoverCell(x, y);
	this.donePicking();
}

Game.prototype.someone_answered = function (who, what) {
	if (who == 1) {
		this.client1_answer = what;
		this.client1_answer_timestamp = Date.now();
	} else {
		this.client2_answer = what;
		this.client2_answer_timestamp = Date.now();
	}

	console.log("client", who, "answered", what);

	if (this.client1_answer && this.client2_answer) this.questionEnded();
}

Game.prototype.broadcast_status_report = function () {
	var report = this.makeStatusReport();
	this.broadcast(report);
}

Game.prototype.broadcast = function (message) {
	this.client1.send(message);
	this.client2.send(message);
}

Game.prototype.makeStatusReport = function () {
	return helpers.message("status-report", {
		player1score: this.client1_score,
		player2score: this.client2_score,
		"options": this.options,
		"state": this.state,
		"question": this.question,
		"uncovered": this.uncovered
	});
}

Game.prototype.newQuestion = function () {
	this.client1_answer = null;
	this.client1_answer_timestamp = null;
	this.client2_answer = null;
	this.client2_answer_timestamp = null;
	this.question = questions.generate();
	this.question_timestamp = Date.now();
	var a = this;
	this.question_timeout = setTimeout(function () {
		Game.prototype.questionEnded.call(a);
	}, this.question_answer_time);

	var qmsg = helpers.message("question", {
		"text": this.question,
		"timestamp": this.question_timestamp,
		"answer_time": this.question_answer_time
	});
	this.broadcast(qmsg);
}

Game.prototype.uncoverCell = function (x, y) {
	console.log("uncovering", x, y);
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
	console.log(this.id, "question ended");

	clearTimeout(this.question_timeout);
	this.question_timeout = null;

	var c1correct = questions.validate(this.question, this.client1_answer);
	var c2correct = questions.validate(this.question, this.client2_answer);



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

	this.client1.send(helpers.message("answer-report", c1report));
	this.client2.send(helpers.message("answer-report", c2report));

	if (!c1correct && !c2correct) this.donePicking();
}

Game.prototype.donePicking = function () {
	this.broadcast_status_report();
	this.newQuestion();
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

function transformImages() {
	for (var id in images_file) {
		var cat = images_file[id];
		for (var i in cat) {
			var item = cat[i];
			imageDB.push({
				name: id,
				url: item.url,
				width: item.width,
				height: item.height
			});
		}
	}
}

function bootstrap() {
	imageOptions = Object.keys(images_file);
	transformImages();
}

bootstrap();
module.exports = Game;
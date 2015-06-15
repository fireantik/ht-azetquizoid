var helpers = require('./helpers.js');
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
	this.time_create = new Date().getTime();
	this.time_start = null;
	this.time_end = null;
	this.client1_score = 0;
	this.client2_score = 0;
}

Game.prototype.serialize = function () {
	return {
		state: this.state,
		id: this.id
	}
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

	this.client1.send(conConfirm);
	this.client2.send(conConfirm);

	console.log("game", this.id, "started");

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

Game.prototype.broadcast_status_report = function () {
	var report = this.makeStatusReport();
	this.client1.send(report);
	this.client2.send(report);
}

Game.prototype.makeStatusReport = function () {
	return helpers.message("status-report", {
		player1score: this.client1_score,
		player2score: this.client2_score,
		"options": this.options,
		"state": this.state
	});
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
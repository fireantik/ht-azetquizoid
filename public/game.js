var socket = new WebSocket("wss://azetquizoid.azurewebsites.net/game");

var gameData = {
	initialized: false,
	waiting: false,
	running: false,
	debugMode: true,
	image: null,
	timestamp: null,
	canPick: false,
	gameId: -1,
	waitCount: 0,
	answerid: 0,
	timeInterval: null,
	answerTime: 0
}
window.questionCount = 1;

var connectionTest = setInterval(function () {
	checkConnection()
}, 500);

function checkConnection() {
	//feature request, do design magic here
	if (!gameData.initialized) {
		gameData.waitCount++;
		if (gameData.waitCount > 40) {
			msgClient("Připojení se nezdařilo");
			document.getElementsByTagName('BODY')[0].className = 'connectionerror';
			socket.close();
			clearInterval(connectionTest);
		}
	} else clearInterval(connectionTest);
}

function image(url, width, height, options, x, y) {
	this.url = url;
	this.width = width;
	this.height = height;
	this.options = options;
	this.x = x;
	this.y = y;
}

function send(type, data) {
	var obj = {
		type: type,
		data: data
	};
	socket.send(JSON.stringify(obj));
}

function parseMsg(event) {
	var msg = event.data;
	var obj = JSON.parse(msg);
	return obj;
}

function createGame() {
	if (gameData.initialized && !gameData.waiting) {
		send("create", {});
		gameData.waiting = true;
		document.getElementById("url").className = "established";
	}
}

function msgClient(data) {
	console.log(data);
	document.getElementById("notifyBar").innerHTML = data;
}

function gameCreated(data) {
	msgClient("Hra byla vytvořena, id: " + data.id);
	gameData.waiting = true;
	gameData.initialized = true;
	document.getElementById("url").value = "http://azetquizoid.azurewebsites.net/?" + data.id;
	document.getElementById("url").select();
}

function gameStarted(data) {
	msgClient("Klient připojen ke hře " + data.id);
	gameData.gameId = data.id;
	gameData.waiting = false;
	gameData.running = true;
	gameData.image = new image(data.img_url, data.img_width, data.img_height, data.options, data.size.x, data.size.y);
	document.getElementsByTagName('BODY')[0].className = 'ingame';
	setTimeout(function () {
		document.getElementById("main").style.display = "none"
	}, 1000);
	var img = document.createElement("img");
	img.src = gameData.image.url;
	document.getElementById("imageContainer").appendChild(img);
	handleOverlay();
	handleSelect(data);
}

function setTimeLeft(time) {
	document.getElementById("time").innerText = (time / 1000).toFixed(0);
}

function timeTick() {
	var ending = gameData.timestamp + gameData.answerTime;
	var left = ending - Date.now();
	setTimeLeft(left);
}

function questionAsked(data) {
	gameData.timestamp = data.timestamp;
	gameData.answerTime = data.answer_time;
	document.getElementById("question").innerHTML = "<span>Otázka " + window.questionCount + ":</span> " + data.text;
	var list = document.getElementById("answerList");
	list.className = "answers";
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
	for (var i = 0; i < data.question_options.length; i++) {
		var button = document.createElement("li");
		button.innerHTML = data.question_options[i];
		button.id = "answer_" + i;
		button.addEventListener("click", function () {
			validateAnswer(this.innerHTML);
			this.className = "selected";
			document.getElementById("answerList").className = "answers selected";
			gameData.answerid = this.id;
		});
		list.appendChild(button);
	}
	window.questionCount++;
	
	if(gameData.timeInterval) clearInterval(gameData.timeInterval);
	gameData.timeInterval = setInterval(timeTick, 50);
}

function validateAnswer(text) {
	var params = {
		text: text
	}
	send("answer", params);
}

function checkAnswer(data) {
	for (var i = 0; i < 4; i++) {
		var button = document.getElementById("answer_" + i);
		button.className = "";
		if (button.innerHTML == data.correct_answer) {
			button.className = " correct";
		}
		if (button.innerHTML == data.opponent_answer) {
			button.className += " op";
			if (data.opponent_answer == data.correct_answer) {
				button.className += " correct";
			} else {
				button.className += " wrong";
			}
		}
	}

	var answer = document.getElementById(gameData.answerid);
	if (data.correct) {
		msgClient("Správná odpověď");
	} else {
		msgClient("Špatně!!!!");
		answer.className += " wrong";
	}
	answer.className += " my";
	if (data.pick) {
		msgClient("Vyberte pole");
		gameData.canPick = true;
		document.getElementById("answerList").className = "answers selected pick";
	}
}

function pickTile(x, y) {
	if (gameData.canPick) {
		var params = {
			x: x,
			y: y
		}
		send("select", params);
	}
	gameData.canPick = false;
}

function gameCheck() {
	gameData.gameId = window.location.search.substring(1);
	if (gameData.gameId != "") {
		console.log("Attempting to connect (id=" + gameData.gameId + ")");
		var params = {
			id: gameData.gameId
		}
		send("connect", params);
		//viz design preview
	} else createGame();
}

function updateGameState(data) {
	if (data.state != "active") {
		msgClient("Hra byla ukončena");
		gameData.running = false;
		gameEnded("ended");
	} else {
		document.getElementById("firstScore").innerHTML = data.player1score;
		document.getElementById("secondScore").innerHTML = data.player2score;
	}

	for (var y = 0; y < gameData.image.y; y++) {
		for (var x = 0; x < gameData.image.x; x++) {
			if (data.uncovered[y][x]) uncover(x, y);
		}
	}
}

function uncover(x, y) {
	document.getElementById(y + "_" + x).className = "erased";
}

function handleImage() {
	var ic = document.getElementById("imageContainer");
	var image = gameData.image;
	ic.setAttribute("style", "width:" + image.width + "px; height:" + image.height + "px;");

	var y_r = image.height / image.y;
	var x_r = image.width / image.x;

	for (var y = 0; y < image.y; y++) {
		for (var x = 0; x < image.x; x++) {
			var slice = document.createElement("div");
			var style = "background-image: url(" + image.url + ");";
			style += "height: " + y_r + "px;";
			style += "width: " + x_r + "px;";
			style += "background-position: -" + (x * x_r) + "px -" + (y * y_r) + "px;";
			style += "float:left";
			slice.setAttribute("style", style);
			console.log(style);
			ic.appendChild(slice);
		}
		ic.appendChild(document.createElement("br"));
	}
}

function handleOverlay() {
	var overlay = document.getElementById("overlay");
	var image = gameData.image;
	var y_r = 100 / image.y;
	var x_r = 100 / image.x;

	var i = 1;
	for (var y = 0; y < image.y; y++) {
		for (var x = 0; x < image.x; x++) {
			var tile = document.createElement("div");
			var style = "height: calc(" + y_r + "% - 10px);";
			style += "width: calc(" + x_r + "% - 10px);";
			tile.setAttribute("style", style);
			tile.innerHTML = i;
			tile.setAttribute("x", x);
			tile.setAttribute("y", y);
			tile.setAttribute("onclick", "pickTile(" + x + "," + y + ")");
			tile.id = y + "_" + x;
			overlay.appendChild(tile);
			i++;
		}
	}
}

function handleSelect(data) {
	var select = document.getElementById("imageGuess");
	for (var i = 0; i < data.options.length; i++) {
		var opt = document.createElement("option");
		opt.text = data.options[i];
		select.add(opt);
	}
}

function guessImage() {
	var select = document.getElementById("imageGuess");
	var text = select.options[select.selectedIndex].text;
	var params = {
		text: text
	}
	send("guess", params);
}

function handleGuess(data) {
	if (data.correct) gameEnded("guess");
	else msgClient("Špatně, hrajete dál!");
}

function gameEnded(data) {
	if(gameData.timeInterval) clearInterval(gameData.timeInterval);
	//for future use, do design changes
	var firstscore = document.getElementById("firstScore").innerHTML;
	var secondscore = document.getElementById("secondScore").innerHTML;

	if (data == "guess") {
		msgClient("Výhra!");
		document.getElementById('game').className += ' gameended';
		if (firstscore > secondscore) {
			document.getElementById('scoretable').className += ' win';
		} else {
			document.getElementById('scoretable').className += ' draft';
		}
		//design magic
	} else if (data == "ended") {
		msgClient("Hra byla ukončena.");
		document.getElementById('game').className += ' gameended';
		if (firstscore < secondscore) {
			document.getElementById('scoretable').className += ' lose';
		} else {
			document.getElementById('scoretable').className += ' draft';
		}
		//includes opponent victory / game connection failure
	}

	for (var y = 0; y < gameData.image.y; y++) {
		for (var x = 0; x < gameData.image.x; x++) {
			uncover(x, y);
		}
	}

	var list = document.getElementById("answerList");
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
	document.getElementById("question").remove();
}

socket.onopen = function (event) {
	gameData.initialized = true;
	gameCheck();
};

socket.onmessage = function (event) {
	var obj = parseMsg(event);
	if (gameData.debugMode) console.log("Data received", obj);
	var type = obj.type;
	var data = obj.data;
	switch (type) {
	case "error":
		console.error(obj.data);
		break;
	case "create-confirm":
		gameCreated(data);
		break;
	case "connect-confirm":
		gameStarted(data);
		break;
	case "question":
		questionAsked(data);
		break;
	case "answer-report":
		checkAnswer(data);
		break;
	case "guess-response":
		handleGuess(data);
		break;
	case "status-report":
		updateGameState(data);
		break;
	default:
		console.warn("Unexpected message: " + obj);
		break;
	}

}
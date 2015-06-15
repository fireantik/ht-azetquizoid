var socket = new WebSocket("ws://azetquizoid.azurewebsites.net/game");

var gameData = {
	initialized: false,
	waiting: false,
	running: false,
	debugMode: true,
	image: null,
	timestamp: null,
	gameId: -1
}

function image(url, width, height, options, size)
{
	this.url = url; 
	this.width = width; 
	this.height = height; 
	this.options = options; 
	this.size = size;
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

function createGame()
{
	if(gameData.initialized && !gameData.waiting) 
	{
		send("create", {});
		gameData.waiting = true;
	}
}

function msgClient(data)
{
	console.log(data);
	document.getElementById("notifyBar").innerHTML = data;
}

function gameStarted(data)
{
	msgClient("Klient připojen ke hře " + data.id);
	gameData.gameId = data.id;
	gameData.waiting = false;
	gameData.running = true;
	gameData.image = new image(data.img_url, data.img_width, data.img_height, data.options, data.size);
	document.getElementById("gameButton").style = "visibility:hidden";
	var img = document.createElement("img");
	img.src = gameData.image.url;
	document.getElementById("imageContainer").appendChild(img);
}

function questionAsked(data)
{
	document.getElementById("question").innerHTML = data.text;
}

function validateAnswer(data)
{
	var ans = document.getElementById("answer").value;
	//checking if value is integer / number - necessary?
	var params = {
		text:ans
	}
	send("answer", params);
}

function checkAnswer(data)
{
	if(data.correct) msgClient("Správná odpověď"); else msgClient("Špatně!!!!");
	if(data.pick) pickTile();
}

function pickTile()
{
	var params = {
		x: 1,
		y: 1
	}
	send("select", params);
}

function gameCheck()
{
	gameData.gameId = window.location.search.substring(1);
	if(gameData.gameId != "")
	{
		console.log("Attempting to connect (id=" + gameData.gameId +")");
		var params = {
			id: gameData.gameId
		}
		send("connect", params);
	//viz design preview
	}
}

function updateGameState(data)
{
	if(data.state != "active") { msgClient("Hra byla ukončena"); gameData.running = false; } 
	else
	{
		document.getElementById("firstScore").innerHTML = data.player1score;
		document.getElementById("secondScore").innerHTML = data.player2score;
	}
}

socket.onopen = function (event) {
  gameData.initialized = true;
  gameCheck();
};

socket.onmessage = function (event) {
		var obj = parseMsg(event);
		if(gameData.debugMode) console.log("Data received", obj);
		var type = obj.type;
		var data = obj.data;
		switch(type)
		{
			case "error": console.error(obj.data); break;
			case "create-confirm": msgClient("Hra byla vytvořena, id: " + data.id); gameData.waiting = true; gameData.initialized = true; break;
			case "connect-confirm": gameStarted(data); break;
			case "question": questionAsked(data); break;
			case "answer-report": checkAnswer(data); break;
			case "guess-response": break;
			case "status-report": updateGameState(data); break;
			default: console.warn("Unexpected message: " + obj); break;
		}

}
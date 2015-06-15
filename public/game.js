var socket = new WebSocket("ws://azetquizoid.azurewebsites.net/game");

var gameData = {
	initialized: false,
	waiting: false,
	running: false,
	debugMode: true,
	image: null,
	gameId: -1
}

function image(url, width, height, options, size)
{
	this.url = url; 
	this.width = width; 
	this.height = heigh; 
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
	gameData.gameId = data.id;
}

function questionAsked(data)
{

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
			case "connect-confirm": msgClient("Klient připojen ke hře " + data.id); gameStarted(data); break;
			case "question": questionAsked(data); break;
			case "answer-report": break;
			case "guess-response" : break;
			case "status-report": break;
			default: console.warn("Unexpected message: " + obj); break;
		}

}
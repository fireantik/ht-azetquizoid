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

function image(url, width, height, options, x, y)
{
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

function gameCreated(data)
{
	msgClient("Hra byla vytvořena, id: " + data.id); 
	gameData.waiting = true; 
	gameData.initialized = true;
	document.getElementById("url").value = "http://azetquizoid.azurewebsites.net/?"+data.id;
	document.getElementById("url").select();
}

function gameStarted(data)
{
	msgClient("Klient připojen ke hře " + data.id);
	gameData.gameId = data.id;
	gameData.waiting = false;
	gameData.running = true;
	gameData.image = new image(data.img_url, data.img_width, data.img_height, data.options, data.size.x, data.size.y);
	//document.getElementById("gameButton").style = "visibility:hidden";
	document.getElementsByTagName('BODY')[0].className='ingame';
	var img = document.createElement("img");
	img.src = gameData.image.url;
	document.getElementById("imageContainer").appendChild(img);
	handleOverlay();
	handleSelect(data);

}

function questionAsked(data)
{
	document.getElementById("question").innerHTML = data.text;
	var list = document.getElementById("answerList");
	while (list.firstChild) {
    list.removeChild(list.firstChild);
	}	
	for(var i = 0; i < data.question_options.length; i++)
	{
		var button = document.createElement("li");
		button.innerHTML = data.question_options[i];
		button.id = "answer_" + i;
		list.appendChild(button);
	}
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
	if(data.pick) { msgClient("Vyberte pole"); pickTile(); }
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
	}else createGame();
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

function handleImage()
{
	var ic = document.getElementById("imageContainer");
	var image = gameData.image;
	ic.setAttribute("style", "width:" + image.width + "px; height:" + image.height + "px;");

	var y_r = image.height / image.y;
	var x_r = image.width / image.x;

	for(var y = 0; y < image.y; y++)
	{
		for(var x = 0; x < image.x; x++)
		{
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

function handleOverlay(){
	var overlay = document.getElementById("overlay");
	var image = gameData.image;
	var y_r = 100 / image.y;
	var x_r = 100 / image.x;

	var i = 1;
	for(var y = 0; y < image.y; y++)
	{
		for(var x = 0; x < image.x; x++)
		{
			var tile = document.createElement("div");
			var style = "height: calc(" + y_r + "% - 10px);";
			style += "width: calc(" + x_r + "% - 10px);";
			tile.setAttribute("style", style);
			tile.innerHTML = i;
			tile.setAttribute("x", x);
			tile.setAttribute("y", y);
			overlay.appendChild(tile);
			i++;
		}
	}
}

function handleSelect(data)
{
	var select = document.getElementById("imageGuess");
	for(var i = 0; i < data.options.length; i++)
	{
		var opt = document.createElement("option");
		opt.text = data.options[i];
		select.add(opt);
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
			case "create-confirm": gameCreated(data); break;
			case "connect-confirm": gameStarted(data); break;
			case "question": questionAsked(data); break;
			case "answer-report": checkAnswer(data); break;
			case "guess-response": break;
			case "status-report": updateGameState(data); break;
			default: console.warn("Unexpected message: " + obj); break;
		}

}

var wsUrl = "ws://localhost:3000/game";

var client1 = {
	name: "client 1",
	socket: new WebSocket(wsUrl),
	game: {}
};
var client2 = {
	name: "client 2",
	socket: new WebSocket(wsUrl),
	game: {}
};

function send(client, type, data) {
	var obj = {
		type: type,
		data: data
	};
	client.socket.send(JSON.stringify(obj));
	console.log(client.name, "sent", obj);
}

setTimeout(function () {
	send(client1, "create", {});
}, 1000);

function parseMsg(event) {
	var msg = event.data;
	var obj = JSON.parse(msg);
	return obj;
}


client1.socket.onmessage = function (event) {
	var obj = parseMsg(event);
	console.log("client 1 received", obj);
	var type = obj.type;
	var data = obj.data;
	if (type == "error") throw new data.message;
	else if (type == "create-confirm") {
		client1.game.id = data.id;
		send(client2, "connect", {
			id: client1.game.id
		});
	} else if (type == "question") {
		client1.game.question = data.text;
		send(client1, "answer", {
			text: "4"
		});
	}
}

client2.socket.onmessage = function (event) {
	var obj = parseMsg(event);
	console.log("client 2 received", obj);
	var type = obj.type;
	var data = obj.data;
	if (type == "error") throw new data.message;
	else if (type == "question") {
		client2.game.question = data.text;
		send(client2, "answer", {
			text: "6"
		});
	}
}
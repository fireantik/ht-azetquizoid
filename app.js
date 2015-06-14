var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var Game = require('./game-handler.js');
var helpers = require('./helpers.js');

var port = process.env.PORT || process.env.port || 3000;

var games = [];

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.ws('/echo', function (ws, req) {
    ws.on('message', function (msg) {
        ws.send(msg);
    });
});

app.ws('/game', function (ws, req) {
    var game = null;

    ws.on('message', function (msg) {
        console.log("received", msg, "from", req.connection.remoteAddress);

        var obj = JSON.parse(msg);
        if (!obj.type) {
            ws.send(helpers.error("no type"));
            return;
        }

        if (!obj.data) {
            ws.send(helpers.error("no data"));
            return;
        }

        var type = obj.type;
        var data = obj.data;

        if (game == null) {
            if (type == "create") {
                game = new Game(ws);
                games.push(game);

                ws.send(helpers.message("create-confirm", {
                    id: game.id
                }));
            } else if (type == "connect") {
                if (!data.id) {
                    ws.send(helpers.error("no id"));
                    return;
                }

                var id = data.id;
                game = games.filter(function (g) {
                    return g.id == id;
                })[0];

                if (!game) {
                    ws.send(helpers.error("game not found"));
                    return;
                }

                if (game.state != "awaiting") {
                    ws.send(helpers.error("game already running"));
                    return;
                }

                game.start(ws);

                ws.send(helpers.message("connect-confirm", {
                    id: game.id
                }));
            } else {
                ws.send(helpers.error("invalid first message. only create/connect are valid"));
            }
        } else {
            game.message(type, data, ws);
        }
    });
});

var server = app.listen(port, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('App listening at http://%s:%s', host, port);
});
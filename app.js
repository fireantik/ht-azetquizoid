var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

var port = process.env.PORT || process.env.port || 3000;

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.ws('/echo', function (ws, req) {
    ws.on('message', function (msg) {
        ws.send(msg);
    });
});

var server = app.listen(port, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
var helpers = require('./helpers.js');

function Game(ws) {
    this.client1 = ws;
    this.client2 = null;

    this.state = "awaiting";
    this.id = makeId();
}

function makeId() {
    return "4";
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
}

Game.prototype.message = function (type, data, ws) {
    var item = this["message_" + type];
    if (typeof (item) == "function") item.call(this, data, ws);
    else ws.send(helpers.error("invalid command"));
}

Game.prototype.message_status = function (data, ws) {
    ws.send(helpers.message("status-report", this.serialize()));
}


module.exports = Game;
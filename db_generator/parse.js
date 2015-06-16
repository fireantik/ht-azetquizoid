var path = require("path");
var fs = require("fs");
var additional = require("./additional.json");

module.exports = {
	items: [],
	names: []
};

function addName(name) {
	if (module.exports.names.indexOf(name) == -1) module.exports.names.push(name);

}

var files = fs.readdirSync(__dirname + '/in/');
files.forEach(function (file) {
	var name = path.basename(file).replace(".json", "");
	addName(name);
	console.log(name);
	var contents = require(__dirname + '/in/' + file);

	if (name != "kočka") return; //TODO remove this line in production!!!
	contents.forEach(function (item) {
		module.exports.items.push({
			name: name,
			url: item.url,
			width: item.width,
			height: item.height
		});
	});
});

additional.forEach(addName);
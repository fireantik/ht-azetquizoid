var size = require('request-image-size');
var types = require('./images_db_types.json');
var http = require('http');
var fs = require('fs');
var request = require('request');

var NUM_URLS = 20;

var output = {};
var imagesSized = 0;


function getAllImages(id, urls) {
	var url = urls[0];
	urls.shift();

	console.log("sizing", url);
	size(url, function (err, dimensions, length) {
		if (!err) {
			console.log("sized", url);
			output[id].push({
				url: url,
				width: dimensions.width,
				height: dimensions.height
			});
			imagesSized++;
		} else {
			console.log("error", url, err);
		}

		if (urls.length > 0) getAllImages(id, urls);
	});
}

function fetchAllImagesets(urls) {
	var current = urls[0];
	var url = current.url;
	var id = current.id;
	urls.shift();
	output[id] = [];

	if (url != "") {
		console.log("downloading", url);
		request(url, function (error, response, body) {
			if (!error) {
				console.log("downloaded", url);
				var lines = body.split('\r\n').filter(function (l) {
					return l != "" && l != " ";
				});
				console.log("found", lines.length);

				lines.sort(function () {
					return 0.5 - Math.random();
				});

				var urlsToGet = lines.slice(0, NUM_URLS);


				getAllImages(id, urlsToGet);
			} else {
				console.log("error", url, error);
			}
			if (urls.length > 0) fetchAllImagesets(urls);
		});
	} else if (urls.length > 0) fetchAllImagesets(urls);
}

function save() {
	console.log("saving", imagesSized, "images");
	fs.writeFile("./images_db.json", JSON.stringify(output, null, "\t"));
}

var u = [];
for (var i in types) {
	u.push({
		id: i,
		url: types[i]
	});
}
fetchAllImagesets(u);

setInterval(save, 1000);
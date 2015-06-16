function addSelected(num) {
	var now = parseInt($("#num_selected").text());
	$("#num_selected").text(now + num);
}

function load() {
	var url = $("#url").val();
	console.log("loading", url);
	$.get(url, function (data) {
		var lines = data.split("\r\n");
		var i = 0;
		lines.forEach(function (link) {
			if (i > 200) return;
			var img = $('<img />');
			img.attr('src', link);
			img.appendTo('#container');
			i++;
		});

		$("#container img").click(function () {
			console.log("click");
			if ($(this).hasClass("picked")) {
				$(this).removeClass("picked");
				addSelected(-1);
			} else {
				$(this).addClass("picked");
				addSelected(1);
			}
		});
	});
}

function save() {
	var items = [];
	$("#container img.picked").each(function () {
		var o = {
			url: this.src,
			width: this.width,
			height: this.height
		};
		items.push(o);
	});
	var json = JSON.stringify(items, null, '\t');
	var blob = new Blob([json], {
		type: "application/json;charset=utf-8"
	});
	saveAs(blob, $("#name").val() + ".json");
}
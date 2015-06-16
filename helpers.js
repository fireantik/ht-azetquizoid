var logentries = require('node-logentries');
var log = logentries.logger({
	token: '30d70748-892e-4799-a3f4-76e7eee3430b'
});

function createMessage(type, data) {
	return JSON.stringify({
		type: type,
		data: data
	});
}

module.exports = {
	message: createMessage,
	error: function (message) {
		return createMessage("error", {
			message: message
		});
	},
	log: log,
	logDebug: function () {
		console.log.apply(this, arguments);
		log.debug.apply(this.arguments);
	},
	logError: function () {
		console.log.apply(this, arguments);
		log.error.apply(this.arguments);
	}
}
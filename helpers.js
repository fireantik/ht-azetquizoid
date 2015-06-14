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
    }
}
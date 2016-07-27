var slice = [].slice;

var Logger = function () {}

Logger.prototype.log = function (messages) {
  var messages = 1 <= messages.length ? slice.call(messages, 0) : []
  messages.push(Date.now())
  return console.log(["[ActionCable]"].concat(slice.call(messages)))
}

module.exports = new Logger()
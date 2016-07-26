var slice = [].slice;

var log = function (arguments) {
  var messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
  messages.push(Date.now());
  return console.log.apply(console, ["[ActionCable]"].concat(slice.call(messages)));
}

module.exports = log
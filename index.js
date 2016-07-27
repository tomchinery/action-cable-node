// Import internal VARS
var INTERNAL = require('./internal.js')
var Consumer = require('./action_cable/consumer.js')
var slice = [].slice;

// Create ActionCable class
var ActionCable = function () {
  this.internal = INTERNAL
}

ActionCable.prototype.createConsumer = function (url) {
  var defaultURL = this.getConfig("url")
  if (url == null) {
    url = defaultURL != null ? defaultURL : this.internal.default_mount_path
  }
  return new Consumer(this.createWebSocketURL(url))
}

ActionCable.prototype.getConfig = function (name) {
  var element = document.head.querySelector("meta[name='action-cable-" + name + "']")
  return element != null ? element.getAttribute("content") : void 0
}

ActionCable.prototype.createWebSocketURL = function (url) {
  if (url && /^wss?:/i.test(url) != true) {
    var a = document.createElement("a")
    a.href = url
    a.protocol = a.protocol.replace("http", "ws")
    return a.href
  } else {
    return url
  }
}

ActionCable.prototype.startDebugging = function () {
  return this.debugging = true
}

ActionCable.prototype.stopDebugging = function () {
  return this.debugging = null
}

ActionCable.prototype.log = function (messages) {
  var messages = 1 <= messages.length ? slice.call(messages, 0) : []
  if (this.debugging) {
    messages.push(Date.now())
    return console.log(["[ActionCable]"].concat(slice.call(messages)))
  }
}

module.exports = new ActionCable()
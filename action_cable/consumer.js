var INTERNAL = require('../internal.js')
var Subscriptions = require('./subscriptions.js')
var Connection = require('./connection.js')

var Consumer = function (url) {
  this.url = url
  this.subscriptions = new Subscriptions(this)
  this.connection = new Connection(this)
}

Consumer.prototype.send = function (data) {
  return this.connection.send(data)
}

Consumer.prototype.connect = function () {
  return this.connection.open()
}

Consumer.prototype.disconnect = function () {
  return this.connection.close({
    allowReconnect: false
  })
}

Consumer.prototype.ensureActiveConnection = function () {
  if (!this.connection.isActive()) {
    return this.connection.open()
  }
}

module.exports = Consumer
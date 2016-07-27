var INTERNAL = require('../internal.js')

var Subscription = function (consumer, params, mixin) {
  this.consumer = consumer
  if (params == null) { params = {} }
  this.identifier = JSON.stringify(params)
  this.extend(this, mixin)
}

Subscription.prototype.perform = function (action, data) {
  if (data == null) { data = {} }
  data.action = action
  return this.send(data)
}

Subscription.prototype.send = function (data) {
  return this.consumer.send({
    command: "message",
    identifier: this.identifier,
    data: JSON.stringify(data)
  })
}

Subscription.prototype.unsubscribe = function () {
  this.consumer.subscriptions.remove(this)
}

Subscription.prototype.extend = function (object, properties) {
  var key, value;
  if (properties != null) {
    for (key in properties) {
      value = properties[key]
      object[key] = value
    }
  }
  return object
}

module.exports = Subscription
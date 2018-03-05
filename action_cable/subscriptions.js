var INTERNAL = require('../internal.js')
var Subscription = require('./subscription.js')

var slice = [].slice;

var Subscriptions = function (consumer) {
  this.consumer = consumer
  this.subscriptions = []
}

Subscriptions.prototype.create = function (channelName, mixin) {
  var channel = channelName
  var params = typeof channel === "object" ? channel : { channel: channel }
  var subscription = new Subscription(this.consumer, params, mixin)
  return this.add(subscription)
}

Subscriptions.prototype.add = function (subscription) {
  this.subscriptions.push(subscription)
  this.consumer.ensureActiveConnection()
  this.notify(subscription, "initalized")
  this.sendCommand(subscription, "subscribe")
  return subscription
}

Subscriptions.prototype.remove = function (subscription) {
  this.forget(subscription)
  if (!this.findAll(subscription.identifier).length) {
    this.sendCommand(subscription, "unsubscribe")
  }
  return subscription
}

Subscriptions.prototype.reject = function (identifier) {
  var ref = this.findAll(identifier)
  var results = []
  for (i = 0; i < ref.length; i++) {
    var subscription = ref[i]
    this.forget(subscription)
    this.notify(subscription, "rejected")
    results.push(subscription)
  }
  return results
}

Subscriptions.prototype.forget = function (subscription) {
  var s, results;
  this.subscriptions = (function () {
    var ref = this.subscriptions
    results = []
    for (i = 0; i < ref.length; i++) {
      s = ref[i]
      if (s !== subscription) {
        results.push(s)
      }
    }
    return results
  }).call(this)
  return subscription
}

Subscriptions.prototype.findAll = function (identifier) {
  var i, len, ref, results, s;
  ref = this.subscriptions;
  results = [];
  for (i = 0, len = ref.length; i < len; i++) {
    s = ref[i];
    if (s.identifier === identifier) {
      results.push(s);
    }
  }
  return results;
}

Subscriptions.prototype.reload = function () {
  var i, len, ref, results, subscription;
  ref = this.subscriptions;
  results = [];
  for (i = 0, len = ref.length; i < len; i++) {
    subscription = ref[i];
    results.push(this.sendCommand(subscription, "subscribe"));
  }
  return results;
}

Subscriptions.prototype.notifyAll = function (callbackName, args) {
  var ref = this.subscriptions;
  var results = [];
  for (i = 0; i < ref.length; i++) {
    subscription = ref[i];
    results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
  }
  return results;
}

Subscriptions.prototype.notify = function (subscription, callbackName, args) {
  var subscriptions, results;
  if (typeof subscription === "string") {
    subscriptions = this.findAll(subscription);
  } else {
    subscriptions = [subscription];
  }
  results = [];
  for (i = 0, len = subscriptions.length; i < len; i++) {
    subscription = subscriptions[i];
    results.push(typeof subscription[callbackName] === "function" ? subscription[callbackName].apply(subscription, args) : void 0);
  }
  return results;
}

Subscriptions.prototype.sendCommand = function (subscription, command) {
  var identifier;
  identifier = subscription.identifier;
  return this.consumer.send({
    command: command,
    identifier: identifier
  })
}

module.exports = Subscriptions

var Base = require('basejs')
var Subscription = require('./subscription.js')

var slice = [].slice;

var Subscriptions = Base.extend({
  constructor: function (consumer) {
    this.consumer = consumer;
    this.subscriptions = [];
    this.self = this
  },

  create: function (channelName, mixin) {
    var channel, params, subscriptions;
    params = typeof channel === "object" ? channel : {
      channel: channel
    };
    subscription = new Subscription(this.consumer, params, mixin).self;
    return this.add(subscription);
  },

  add: function (subscription) {
    this.subscriptions.push(subscription);
    this.consumer.ensureActiveConnection();
    this.notify(subscription, "initalized");
    this.sendCommand(subscription, "subscribe");
    return subscription;
  },

  remove: function (subscription) {
    this.forget(subscription);
    if (!this.findAll(subscription.identifier).length) {
      this.sendCommand(subscription, "unsubscribe");
    }
    return subscription;
  },

  reject: function (identifier) {
    var i, len, ref, results, subscription;
    ref = this.findAll(identifier);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      subscription = ref[i];
      this.forget(subscription);
      this.notify(subscription, "rejected");
      results.push(subscription);
    }
    return results;
  },

  forget: function (subscription) {
    var s;
    this.subscriptions = (function() {
      var i, len, ref, results;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        if (s !== subscription) {
          results.push(s);
        }
      }
      return results;
    }).call(this);
    return subscription;
  },

  findAll: function (identifier) {
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
  },

  reload: function () {
    var i, len, ref, results, subscription;
    ref = this.subscriptions;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      subscription = ref[i];
      results.push(this.sendCommand(subscription, "subscribe"));
    }
    return results;
  },

  notifyAll: function () {
    var args, callbackName, i, len, ref, results, subscription;
    callbackName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    ref = this.subscriptions;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      subscription = ref[i];
      results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
    }
    return results;
  },

  notify: function () {
    var args, callbackName, i, len, results, subscription, subscriptions;
    subscription = arguments[0], callbackName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
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
  },

  sendCommand: function (subscription, command) {
    var identifier;
    identifier = subscription.identifier;
    return this.consumer.send({
      command: command,
      identifier: identifier
    });
  }
});

module.exports = Subscriptions
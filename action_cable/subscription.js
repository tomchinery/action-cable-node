var Base = require('basejs')
var ActionCable = require('../action_cable.js')

var Subscription = Base.extend({
  constructor: function (consumer, params, mixin) {
    this.consumer = consumer;
    if (params == null) {
      params = {};
    }
    this.identifier = JSON.stringify(params);
    this.extendIt(this, mixin);
    this.self = this
  },

  perform: function (action, data) {
    if (data == null) {
      data = {};
    }
    data.action = action;
    return this.send(data);
  },

  send: function (data) {
    return this.consumer.send({
      command: "message",
      identifier: this.identifier,
      data: JSON.stringify(data)
    });
  },

  unsubscribe: function() {
    return this.consumer.subscriptions.remove(this);
  },

  extendIt: function (object, properties) {
    var key, value;
    if (properties != null) {
      for (key in properties) {
        value = properties[key];
        object[key] = value;
      }
    }
    return object;
  }

});

module.exports = Subscription
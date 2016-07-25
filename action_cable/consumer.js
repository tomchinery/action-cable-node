var Base = require('basejs')
var ActionCable = require('../action_cable.js')

var Consumer = Base.extend({
  constructor: function (url) {
    this.url = url
    this.subscriptions = new Subscriptions(this);
    this.connection = new Connection(this);
  },

  send: function (data) {
    return this.connection.send(data);
  },

  connect: function () {
    return this.connection.open();
  },

  disconnect: function () {
    return this.connection.close({
      allowReconnect: false
    });
  },

  ensureActiveConnection: function () {
    if (!this.connection.isActive()) {
      return this.connection.open();
    }
  }
});

module.exports = { Consumer: Consumer }
var Base = require('basejs')
var INTERNAL_JSON = require('./internal.js')
var Consumer = require('./action_cable/consumer.js')

var ActionCable = Base.extend({

  constructor: function () {
    this.self = this
  },

  INTERNAL: INTERNAL_JSON,

  createConsumer: function (url) {
    var ref;
    if (url == null) {
      url = (ref = this.getConfig("url")) != null ? ref : this.INTERNAL.default_mount_path;
    }
    return new Consumer(this.createWebSocketURL(url)).self
  },

  getConfig: function (name) {
    var element = document.head.querySelector("meta[name='action-cable-" + name + "']");
    return element != null ? element.getAttribute("content") : void 0;
  },

  createWebSocketURL: function (url) {
    var a;
    if (url && /^wss?:/i.test(url) != true) {
      a = document.createElement("a");
      a.href = url;
      a.href = a.href;
      a.protocol = a.protocol.replace("http", "ws");
      return a.href;
    } else {
      return url;
    }
  },

  startDebugging: function() {
    return this.debugging = true;
  },

  stopDebugging: function () {
    return this.debugging = null;
  },

  log: function() {
    var messages;
    messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    if (this.debugging) {
      messages.push(Date.now());
      return console.log.apply(console, ["[ActionCable]"].concat(slice.call(messages)));
    }
  }
});

module.exports = ActionCable
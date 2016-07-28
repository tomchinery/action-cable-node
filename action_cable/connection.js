var INTERNAL = require('../internal.js')
var Logger = require('./logger.js')

var ConnectionMonitor = require('./connection_monitor.js')

var message_types = INTERNAL.message_types
var supportedProtocols = INTERNAL.protocols
var protocols = INTERNAL.protocols

var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

var slice = [].slice;

var Connection = function (consumer) {
  this.consumer = consumer
  this.open = bind(this.open, this)
  this.subscriptions = this.consumer.subscriptions
  this.monitor = new ConnectionMonitor(this)
  this.disconnected = true
  this.reopenDelay = 500
}

Connection.prototype.send = function(data) {
  if (this.isOpen()) {
    this.webSocket.send(JSON.stringify(data))
    return true
  } else {
    return false
  }
}

Connection.prototype.open = function () {
  if (this.isActive()) {
    Logger.log(["Attempted to open WebSocket, but existing socket is " + (this.getState())])
    throw new Error("Existing connection must be closed before opening");
  } else {
    Logger.log(["Opening WebSocket, current state is " + (this.getState()) + ", subprotocols: " + protocols])
    if (this.webSocket != null) {
      this.uninstallEventHandlers()
    }
    this.webSocket = new WebSocket(this.consumer.url, protocols)
    this.installEventHandlers()
    this.monitor.start()
    return true
  }
}

Connection.prototype.close = function (arg) {
  var allowReconnect = (arg != null ? arg : { allowReconnect: true }).allowReconnect
  if (!allowReconnect) {
    this.monitor.stop()
  }
  if (this.isActive()) {
    return this.webSocket != null ? this.webSocket.close() : void 0
  }
}

Connection.prototype.reopen = function () {
  var error;
  Logger.log(["Reopening WebSocket, current state is " + (this.getState())])
  if (this.isActive()) {
    try {
      return this.close()
    } catch (_error) {
      error = _error
      return Logger.log(["Failed to reopen WebSocket", error])
    } finally {
      Logger.log(["Reopening WebSocket in " + this.reopenDelay + "ms"])
      setTimeout(this.open, this.reopenDelay)
    }
  } else {
    return this.open()
  }
}

Connection.prototype.getProtocol = function () {
  return this.webSocket != null ? this.webSocket.protocol : void 0
}

Connection.prototype.isOpen = function () {
  return this.isState(["open"])
}

Connection.prototype.isActive = function () {
  return this.isState(["open", "connecting"])
}

Connection.prototype.isProtocolSupported = function () {
  var ref;
  return ref = this.getProtocol(), indexOf.call(supportedProtocols, ref) >= 0;
}

Connection.prototype.isState = function (states) {
  var ref;
  states = 1 <= states.length ? slice.call(states, 0) : []
  return ref = this.getState(), indexOf.call(states, ref) >= 0;
}

Connection.prototype.getState = function () {
  var ref, state, value;
  for (state in WebSocket) {
    value = WebSocket[state];
    if (value === ((ref = this.webSocket) != null ? ref.readyState : void 0)) {
      return state.toLowerCase();
    }
  }
  return null
}

Connection.prototype.installEventHandlers = function () {
  var eventName, handler;
  for (eventName in this.events) {
    handler = this.events[eventName].bind(this)
    this.webSocket["on" + eventName] = handler
  }
}

Connection.prototype.uninstallEventHandlers = function () {
  var eventName;
  for (eventName in this.events) {
    this.webSocket["on" + eventName] = function() {};
  }
}

Connection.prototype.events = function () {
  return {
    message: function(event) {
      var identifier, message, ref, type;
      if (!this.isProtocolSupported()) {
        return;
      }
      ref = JSON.parse(event.data), identifier = ref.identifier, message = ref.message, type = ref.type;
      switch (type) {
        case message_types.welcome:
          this.monitor.recordConnect();
          return this.subscriptions.reload();
        case message_types.ping:
          return this.monitor.recordPing();
        case message_types.confirmation:
          return this.subscriptions.notify(identifier, "connected");
        case message_types.rejection:
          return this.subscriptions.reject(identifier);
        default:
          return this.subscriptions.notify(identifier, "received", message);
      }
    },
    open: function() {
      Logger.log(["WebSocket onopen event, using '" + (this.getProtocol()) + "' subprotocol"]);
      this.disconnected = false;
      if (!this.isProtocolSupported()) {
        Logger.log(["Protocol is unsupported. Stopping monitor and disconnecting."]);
        return this.close({
          allowReconnect: false
        });
      }
    },
    close: function(event) {
      Logger.log(["WebSocket onclose event"]);
      if (this.disconnected) {
        return;
      }
      this.disconnected = true;
      this.monitor.recordDisconnect();
      return this.subscriptions.notifyAll("disconnected", {
        willAttemptReconnect: this.monitor.isRunning()
      });
    },
    error: function() {
      return log("WebSocket onerror event");
    }
  }
}

module.exports = Connection
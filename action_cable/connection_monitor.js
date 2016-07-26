var Base = require('basejs')
var ActionCable = require('../action_cable.js')
var INTERNAL_JSON = require('../internal.js')

var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

var clamp, now, secondsSince;

now = function() {
  return new Date().getTime();
};

secondsSince = function(time) {
  return (now() - time) / 1000;
};

clamp = function(number, min, max) {
  return Math.max(min, Math.min(max, number));
};

var ConnectionMonitor = Base.extend({
  constructor: function (connection) {
    this.connection = connection;
    this.visibilityDidChange = bind(this.visibilityDidChange, this);
    this.reconnectAttempts = 0;
  },

  pollInterval: {
    min: 3,
    max: 30
  },

  staleThreshold: 6,

  start: function () {
    if (!this.isRunning()) {
      this.startedAt = now();
      delete this.stoppedAt;
      this.startPolling();
      document.addEventListener("visibilitychange", this.visibilityDidChange);
      return ActionCable.log("ConnectionMonitor started. pollInterval = " + (this.getPollInterval()) + " ms");
    }
  },

  stop: function () {
    if (this.isRunning()) {
      this.stoppedAt = now();
      this.stopPolling();
      document.removeEventListener("visibilitychange", this.visibilityDidChange);
      return ActionCable.log("ConnectionMonitor stopped");
    }
  },

  isRunning: function () {
    return (this.startedAt != null) && (this.stoppedAt == null);
  },

  recordPing: function () {
    return this.pingedAt = now();
  },

  recordConnect: function () {
    this.reconnectAttempts = 0;
    this.recordPing();
    delete this.disconnectedAt;
    return ActionCable.log("ConnectionMonitor recorded connect");
  },

  recordDisconnect: function () {
    this.disconnectedAt = now();
    return ActionCable.log("ConnectionMonitor recorded disconnect");
  },

  startPolling: function () {
    this.stopPolling();
    return this.poll();
  },

  stopPolling: function () {
    return clearTimeout(this.pollTimeout);
  },

  poll: function () {
    return this.pollTimeout = setTimeout((function(_this) {
      return function() {
        _this.reconnectIfStale();
        return _this.poll();
      };
    })(this), this.getPollInterval());
  },

  getPollInterval: function () {
    var interval, max, min, ref;
    ref = this.constructor.pollInterval, min = ref.min, max = ref.max;
    interval = 5 * Math.log(this.reconnectAttempts + 1);
    return Math.round(clamp(interval, min, max) * 1000);
  },

  reconnectIfStale: function () {
    if (this.connectionIsStale()) {
      ActionCable.log("ConnectionMonitor detected stale connection. reconnectAttempts = " + this.reconnectAttempts + ", pollInterval = " + (this.getPollInterval()) + " ms, time disconnected = " + (secondsSince(this.disconnectedAt)) + " s, stale threshold = " + this.constructor.staleThreshold + " s");
      this.reconnectAttempts++;
      if (this.disconnectedRecently()) {
        return ActionCable.log("ConnectionMonitor skipping reopening recent disconnect");
      } else {
        ActionCable.log("ConnectionMonitor reopening");
        return this.connection.reopen();
      }
    }
  },

  connectionIsStale: function () {
    var ref;
    return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.constructor.staleThreshold;
  },

  disconnectedRecently: function () {
    return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
  },

  visibilityDidChange: function () {
    if (document.visibilityState === "visible") {
      return setTimeout((function(_this) {
        return function() {
          if (_this.connectionIsStale() || !_this.connection.isOpen()) {
            ActionCable.log("ConnectionMonitor reopening stale connection on visibilitychange. visbilityState = " + document.visibilityState);
            return _this.connection.reopen();
          }
        };
      })(this), 200);
    }
  }
});

module.exports = { ConnectionMonitor: ConnectionMonitor }
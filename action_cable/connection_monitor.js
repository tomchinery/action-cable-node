var INTERNAL = require('../internal.js')
var Logger = require('./logger.js')

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

var ConnectionMonitor = function (connection) {
  this.connection = connection
  this.visibilityDidChange = bind(this.visibilityDidChange, this)
  this.reconnectAttempts = 0
  this.pollInterval = {
    min: 3,
    max: 30
  }
  this.staleThreshold = 6
}

ConnectionMonitor.prototype.start = function () {
  if (!this.isRunning()) {
    this.startedAt = now();
    delete this.stoppedAt;
    this.startPolling();
    document.addEventListener("visibilitychange", this.visibilityDidChange);
    return Logger.log(["ConnectionMonitor started. pollInterval = " + (this.getPollInterval()) + " ms"]);
  }
}

ConnectionMonitor.prototype.stop = function () {
  if (this.isRunning()) {
    this.stoppedAt = now();
    this.stopPolling();
    document.removeEventListener("visibilitychange", this.visibilityDidChange);
    return Logger.log("ConnectionMonitor stopped");
  }
}

ConnectionMonitor.prototype.isRunning = function () {
  return (this.startedAt != null) && (this.stoppedAt == null)
}

ConnectionMonitor.prototype.recordPing = function () {
  return this.pingedAt = now()
}

ConnectionMonitor.prototype.recordConnect = function () {
  this.reconnectAttempts = 0;
  this.recordPing();
  delete this.disconnectedAt;
  return Logger.log(["ConnectionMonitor recorded connect"]);
}

ConnectionMonitor.prototype.recordDisconnect = function () {
  this.disconnectedAt = now();
  return Logger.log(["ConnectionMonitor recorded disconnect"]);
}

ConnectionMonitor.prototype.startPolling = function () {
  this.stopPolling()
  return this.poll()
}

ConnectionMonitor.prototype.stopPolling = function () {
  return clearTimeout(this.pollTimeout)
}

ConnectionMonitor.prototype.poll = function () {
  return this.pollTimeout = setTimeout((function(_this) {
    return function() {
      _this.reconnectIfStale();
      return _this.poll();
    };
  })(this), this.getPollInterval());
}

ConnectionMonitor.prototype.getPollInterval = function () {
  var interval, max, min;
  max = this.pollInterval.max
  min = this.pollInterval.min
  interval = 5 * Math.log(this.reconnectAttempts + 1);
  return Math.round(clamp(interval, min, max) * 1000);
}

ConnectionMonitor.prototype.reconnectIfStale = function () {
  if (this.connectionIsStale()) {
    Logger.log(["ConnectionMonitor detected stale connection. reconnectAttempts = " + this.reconnectAttempts + ", pollInterval = " + (this.getPollInterval()) + " ms, time disconnected = " + (secondsSince(this.disconnectedAt)) + " s, stale threshold = " + this.staleThreshold + " s"]);
    this.reconnectAttempts++;
    if (this.disconnectedRecently()) {
      return Logger.log(["ConnectionMonitor skipping reopening recent disconnect"]);
    } else {
      Logger.log(["ConnectionMonitor reopening"]);
      return this.connection.reopen();
    }
  }
}

ConnectionMonitor.prototype.connectionIsStale = function () {
  var ref;
  return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.staleThreshold;
}

ConnectionMonitor.prototype.disconnectedRecently = function () {
  return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.staleThreshold
}

ConnectionMonitor.prototype.visibilityDidChange = function () {
  if (document.visibilityState === "visible") {
    return setTimeout((function(_this) {
      return function() {
        if (_this.connectionIsStale() || !_this.connection.isOpen()) {
          Logger.log(["ConnectionMonitor reopening stale connection on visibilitychange. visbilityState = " + document.visibilityState]);
          return _this.connection.reopen();
        }
      };
    })(this), 200);
  }
}

module.exports = ConnectionMonitor
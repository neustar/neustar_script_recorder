var pref_service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.selenium-ide.");

function Log(category) {
  var log = this;
  var self = this;
  this.category = category;
  
  function LogLevel(level, name) {
    this.level = level;
    this.name = name;
    var self = this;
    log[name.toLowerCase()] = function(msg) { log.log(self, msg); };
  }

  this.DEBUG = new LogLevel(1, "DEBUG");
  this.INFO = new LogLevel(2, "INFO");
  this.WARN = new LogLevel(3, "WARN");
  this.ERROR = new LogLevel(4, "ERROR");

  this.log = function(level, msg) {
    var threshold = this[this._getThreshold()];
    if (level.level >= threshold.level) {
      this._write("Selenium IDE [" + level.name + "] " + 
                      this._formatDate(new Date()) + " " +
            self.category + ": " + msg);
    }
  };
};

Log.prototype = {
    _getThreshold: function() {
        if (!this.threshold) {
            try {
              this.threshold = pref_service.getCharPref("internalLogThreshold", "INFO");
            } catch (e) {
              this.threshold = "INFO";
            }
        }
        return this.threshold;
    },

    _formatDate: function(date) {
        return date.getFullYear() + 
          "-" + this._formatDigits(date.getMonth() + 1, 2) + 
          "-" + this._formatDigits(date.getDate(), 2) +
          " " + this._formatDigits(date.getHours(), 2) +
          ":" + this._formatDigits(date.getMinutes(), 2) +
          ":" + this._formatDigits(date.getSeconds(), 2) +
          "." + this._formatDigits(date.getMilliseconds(), 3);
    },

    _formatDigits: function(n, digits) {
        var s = n.toString();
        var pre = digits - s.length;
        var result = "";
        for (var i = 0; i < pre; i++) {
            result += "0";
        }
        result += s;
        return result;
    },

    _write: function(message) {
        var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);
        if (consoleService != null) {
            consoleService.logStringMessage(message);
        }
    }
};
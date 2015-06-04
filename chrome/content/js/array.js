if(!Array.prototype.contains) {
  Array.prototype.contains = function(obj) {
      var i = this.length;
      while (i--) {
          if (this[i] === obj) {
              return true;
          }
      }
      return false;
  };
};

if(!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
};
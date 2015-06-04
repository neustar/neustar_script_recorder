RegexpMatch.prototype.toString = function() {
  return "Regex.IsMatch(" + this.expression + ", " + string(this.pattern) + ")";
};
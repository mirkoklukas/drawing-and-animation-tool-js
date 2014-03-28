

function mod(a, b) {
    return ((a % b) + b) % b;
};

Number.prototype.mod = function (b) {
    return ((this % b) + b) % b;
};

var bind = function(that, f) {
  return function() {
    return f.apply(that, arguments);
  }
};

if(!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    }
}
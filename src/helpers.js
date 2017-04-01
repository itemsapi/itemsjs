var _ = require('lodash');

module.exports.includes = function(items, filters) {
  return !filters || _.every(filters, (val) => {
    return _.includes(items, val);
  });
}

module.exports.includes_any = function(items, filters) {
  return !filters || _.some(filters, (val) => {
    return _.includes(items, val);
  });
}

module.exports.intersection = function(a, b) {
  if (!b) {
    return a;
  }
  return _.intersection(a, _.flatten(b));
}



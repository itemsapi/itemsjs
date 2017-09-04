var _ = require('./../lib/lodash');

module.exports.includes = function(items, filters) {
  return !filters || _.every(filters, (val) => {
    return _.includes(items, val);
  });
}

module.exports.includes_any = function(items, filters) {

  //return !filters || (_.isArray(filters) && !filters.length) || _.some(filters, (val) => {
  return !filters || (filters instanceof Array && filters.length === 0) || _.some(filters, (val) => {
    return _.includes(items, val);
  });
}

module.exports.intersection = function(a, b) {
  if (!b) {
    return a;
  }
  return _.intersection(a, _.flatten(b));
}

var clone = function(val) {

  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    return val;
  }
}

module.exports.mergeAggregations = function(aggregations, input) {

  return _.mapValues(clone(aggregations), (val, key) => {

    var filters = [];
    if (input.filters && input.filters[key]) {
      filters = input.filters[key];
    }

    val.filters = filters;

    return val;
  });
}



var _ = require('./../lib/lodash');

module.exports.includes = function(items, filters) {
  return !filters || _.every(filters, (val) => {
    return _.includes(items, val);
  });
}

/**
 * not sure if mathematically correct
 */
module.exports.includes_any = function(items, filters) {

  //return !filters || (_.isArray(filters) && !filters.length) || _.some(filters, (val) => {
  return !filters || (filters instanceof Array && filters.length === 0) || _.some(filters, (val) => {

    return _.includes(items, val);
  });
}

/**
 * if included particular elements (not array)
 */
module.exports.includes_any_element = function(items, filters) {

  return _.some(filters, (val) => {
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

    var not_filters = [];
    if (input.not_filters && input.not_filters[key]) {
      not_filters = input.not_filters[key];
    }

    val.not_filters = not_filters;


    return val;
  });
}

/**
 * should be moved to the new facet class
 */
var is_conjunctive_agg = function(aggregation) {
  return aggregation.conjunction !== false;
}

var is_disjunctive_agg = function(aggregation) {
  return aggregation.conjunction === false;
}

var is_not_filters_agg = function(aggregation) {
  return aggregation.not_filters instanceof Array && aggregation.not_filters.length > 0;
}


var conjunctive_field = function(set, filters) {
  return module.exports.includes(set, filters);
}

var disjunctive_field = function(set, filters) {
  return module.exports.includes_any(set, filters);
}

var not_filters_field = function(set, filters) {
  return !module.exports.includes_any_element(set, filters);
}

var empty_field = function(set) {
  if (set === undefined || set === null || (set instanceof Array && set.length === 0)) {
    return true;
  }

  return false;
}

module.exports.is_conjunctive_agg = is_conjunctive_agg;
module.exports.is_disjunctive_agg = is_disjunctive_agg;
module.exports.is_not_filters_agg = is_not_filters_agg;

module.exports.conjunctive_field = conjunctive_field;
module.exports.disjunctive_field = disjunctive_field;
module.exports.not_filters_field = not_filters_field;
module.exports.empty_field = empty_field;

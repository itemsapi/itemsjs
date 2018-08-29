import _ from 'lodash';

export function includes(items, filters) {
  return !filters || _.every(filters, (val) => {
    return _.includes(items, val);
  });
}

/**
 * not sure if mathematically correct
 */
export function includes_any(items, filters) {

  //return !filters || (_.isArray(filters) && !filters.length) || _.some(filters, (val) => {
  return !filters || (filters instanceof Array && filters.length === 0) || _.some(filters, (val) => {

    return _.includes(items, val);
  });
}

/**
 * if included particular elements (not array)
 */
export function includes_any_element(items, filters) {

  return _.some(filters, (val) => {
    return _.includes(items, val);
  });
}

export function intersection(a, b) {
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

export function mergeAggregations(aggregations, input) {

  return _.mapValues(clone(aggregations), (val, key) => {

    if (!val.field) {
      val.field = key;
    }

    var filters = [];
    if (input.filters && input.filters[key]) {
      filters = input.filters[key];
    }

    val.filters = filters;

    var not_filters = [];
    if (input.not_filters && input.not_filters[key]) {
      not_filters = input.not_filters[key];
    }

    if (input.exclude_filters && input.exclude_filters[key]) {
      not_filters = input.exclude_filters[key];
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

var is_empty_agg = function(aggregation) {
  return aggregation.type === 'is_empty';
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

var check_empty_field = function(set, filters) {

  var output = ['not_empty'];

  if (set === '' || set === undefined || set === null || (set instanceof Array && set.length === 0)) {

    //return true;
    output = ['empty'];
  }

  // check also if filters is not empty array
  if (filters && !module.exports.includes(output, filters)) {
    return false;
  }

  return output;
}

/*var empty_field = function(set, filters) {
  if (set === undefined || set === null || (set instanceof Array && set.length === 0)) {
    return true;
  }

  return false;
}*/

export {is_conjunctive_agg};

export {is_disjunctive_agg};
export {is_not_filters_agg};
export {is_empty_agg};
export {conjunctive_field};
export {disjunctive_field};
export {not_filters_field};
export {check_empty_field};

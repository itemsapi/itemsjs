var Promise = require('bluebird');
var _ = require('lodash');
var helpers = require('./helpers');
var Fulltext = require('./fulltext');

//module.exports.search = function(items, options) {
module.exports.search = function(items, input, configuration) {

  input = input || {};

  // responsible for full text search over the items
  //items = module.exports.full_text_search(items, input, configuration);
  // it should be run once on initialization then it is 2x faster
  //var fulltext = new Fulltext(items);
  //items = fulltext.search(input.query);

  // resonsible to search over the items by aggregation values
  items = module.exports.items_by_aggregations(items, input.aggregations);

  var per_page = input.per_page || 12;
  var page = input.page || 1;

  var aggregations = module.exports.aggregations(items, input.aggregations);

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: items.length
    },
    data: {
      items: items.slice((page - 1) * per_page, page * per_page),
      aggregations: aggregations
    }
  };
}

module.exports.items_by_aggregations = function(items, aggregations) {
  return _.filter(items, (item) => {
    return module.exports.aggregateable_item(item, aggregations);
  });
}

module.exports.aggregations = function(items, aggregations) {

  return _.mapValues((aggregations), (val, key) => {
    return {
      name: key,
      buckets: module.exports.buckets(items, key, val, aggregations).slice(0, 10)
    }
  })
}


module.exports.aggregateable_item = function(item, aggregations) {

  return _.every(_.keys(aggregations), (key) => {
    return helpers.includes(item[key], aggregations[key].filters);
  });
}

/*
 * fields count for one item based on aggregation options
 */
module.exports.bucket = function(item, aggregations) {

  return _.mapValues((aggregations), (val, key) => {
    let other_aggregations = _.clone(aggregations);
    delete other_aggregations[key];
    let other_aggregations_keys = _.keys(other_aggregations);

    if (_.every(other_aggregations_keys, (key) => {
      return helpers.includes(item[key], aggregations[key].filters);
    }) === true) {
      if (helpers.includes(item[key], aggregations[key].filters)) {
        return item[key];
      } else {
        return [];
      }
    } else {
      return [];
    }
  });
}

module.exports.buckets = function(items, field, agg, aggregations) {

  var buckets = _.transform(items, function(result, item) {

    item = module.exports.bucket(item, aggregations)
    var keys = item[field];


    if (helpers.includes(keys, agg.filters)) {
      // go through keys in item field
      for (var i = 0 ; keys && i < keys.length ; ++i) {
        var key = keys[i];
        if (!result[key]) {
          result[key] = 1;
        } else {
          result[key] += 1;
        }
      }
    }

  }, {});

  // transform object of objects to array of objects
  buckets = _.map(buckets, (val, key) => {
    return {
      key: key,
      doc_count: val
    };
  })

  // sort array of objects from the most popular keywords
  // and key asc
  buckets = _.sortBy(buckets, [(val) => {
    return -val.doc_count;
  }, (val) => {
    return val.key;
  }]);

  return buckets;
}

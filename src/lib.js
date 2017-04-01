var Promise = require('bluebird');
var _ = require('lodash');
var helpers = require('./helpers');

module.exports.search = function(items, options) {

  options = options || {};
  //options.aggregations = options.aggregations || {};

  items = module.exports.items_by_aggregations(items, options.aggregations);

  var per_page = options.per_page || 12;
  var page = options.page || 1;

  var aggregations = module.exports.aggregations(items, options.aggregations);

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
      buckets: module.exports.buckets(items, key, val, aggregations).slice(0, 10)
    }
  })
  return {
    tags: {
      buckets: module.exports.buckets(items, 'tags')
    },
    actors:  {
      buckets: module.exports.buckets(items, 'actors')
    }
  }
}


module.exports.aggregateable_item = function(item, aggregations) {

    return _.every(_.keys(aggregations), (key) => {
      return helpers.includes(item[key], aggregations[key].filters);
    });

  return _.mapValues((aggregations), (val, key) => {
    let other_aggregations = _.clone(aggregations);
    delete other_aggregations[key];
    let other_aggregations_keys = _.keys(other_aggregations);


    return _.every(_.keys(aggregations), (key) => {
      return helpers.includes(item[key], aggregations[key].filters);
    });


    if (_.every(other_aggregations_keys, (key) => {
      return helpers.includes(item[key], aggregations[key].filters);
    }) === true) {
      if (helpers.includes(item[key], aggregations[key].filters)) {
        return item[key];
      } else {
        return [];
      }
      //return item[key];
      //return helpers.intersection(item[key], aggregations[key].filters);
    } else {
      return [];
    }
  });
}


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
      //return item[key];
      //return helpers.intersection(item[key], aggregations[key].filters);
    } else {
      return [];
    }
  });
}

module.exports.buckets = function(items, field, agg, aggregations) {

  var buckets = _.transform(items, function(result, item) {

    //console.log(module.exports.bucket(item, aggregations));
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

/*module.exports.search = function(items, options) {
  return new Promise(function (resolve, reject) {
    return resolve({
      data: {
        items: items,
        aggregations: {
          tags: {
            doc_count: 10,
            buckets: [{
              key: "love",
              doc_count: 332
            },
            {
              key: "humor",
              doc_count: 272
            },
            {
              key: "inspirational",
              doc_count: 262
            }],
          }
        }
      }

    })
  });
}

*/

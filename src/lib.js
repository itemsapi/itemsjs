var _ = require('./mylodash');
var helpers = require('./helpers');
var Fulltext = require('./fulltext');

/**
 * search by filters
 */
module.exports.search = function(items, input, configuration) {

  input = input || {};


  // responsible to filters items by aggregation values (processed input)
  var filtered_items = module.exports.items_by_aggregations(items, input.aggregations);

  var per_page = input.per_page || 12;
  var page = input.page || 1;

  // calculate aggregations based on items and processed input
  // it returns buckets
  //var aggregations = module.exports.aggregations(filtered_items, input.aggregations);
  var aggregations = module.exports.aggregations(items, input.aggregations);

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: filtered_items.length
    },
    data: {
      items: filtered_items.slice((page - 1) * per_page, page * per_page),
      aggregations: aggregations
    }
  };
}

/**
 * return items which pass filters (aggregations)
 */
module.exports.items_by_aggregations = function(items, aggregations) {

  return _.filter(items, (item) => {
    return module.exports.filterable_item(item, aggregations);
  });
}

/**
 * it returns list of aggregations with buckets
 * it calculates based on object filters like {tags: ['drama', '1980s']} against list of items
 * in realtime
 *
 * @TODO
 * consider caching aggregations results in startup time
 */
module.exports.aggregations = function(items, aggregations) {

  var position = 0;
  return _.mapValues((aggregations), (val, key) => {
    // key is a 'tags' and val is ['drama', '1980s']
    ++position;
    return {
      name: key,
      title: val.title || key.charAt(0).toUpperCase() + key.slice(1),
      position: position,
      buckets: module.exports.buckets(items, key, val, aggregations).slice(0, val.size || 10)
    }
  })
}


/**
 * checks if item is passing aggregations - if it's filtered or not
 * @TODO should accept filters (user input) as the parameter
 * and not user params merged with global config
 */
module.exports.filterable_item = function(item, aggregations) {

  return _.every(_.keys(aggregations), (key) => {

    if (aggregations[key].conjunction === false) {
      return helpers.includes_any(item[key], aggregations[key].filters);
    } else {
      return helpers.includes(item[key], aggregations[key].filters);
    }
  });
}


/*
 * fields count for one item based on aggregation options
 * returns buckets objects
 */
module.exports.bucket_field = function(item, aggregations, key) {

  let clone_aggregations = _.clone(aggregations);
  delete clone_aggregations[key];

  // all aggregations except current one
  let clone_aggregations_keys = _.keys(clone_aggregations);

  // check if all aggregations except current key are including properly
  if (_.every(clone_aggregations_keys, (key) => {
    return helpers.includes(item[key], aggregations[key].filters);
  }) === true) {

    if (aggregations[key].conjunction === false || helpers.includes(item[key], aggregations[key].filters)) {
      //return _.flatten([item[key]]);
      return item[key] ? _.flatten([item[key]]) : [];
    }
  }

  return [];
}

/*
 * fields count for one item based on aggregation options
 * returns buckets objects
 */
module.exports.bucket = function(item, aggregations) {

  return _.mapValues((aggregations), (val, key) => {

    return module.exports.bucket_field(item, aggregations, key);
  });
}

/**
 * returns buckets list for items for specific key and aggregation configuration
 *
 * @TODO it should be more lower level and should not be dependent directly on user configuration
 * should be able to sort buckets alphabetically, by count and by asc or desc
 */
module.exports.buckets = function(items, field, agg, aggregations) {

  var buckets = _.transform(items, function(result, item) {

    item = module.exports.bucket(item, aggregations)
    var elements = item[field];

    if (
      agg.conjunction !== false && helpers.includes(elements, agg.filters)
    //|| agg.conjunction === false && helpers.includes_any(elements, agg.filters)
    || agg.conjunction === false
       ) {

      // go through elements in item field
      for (var i = 0 ; elements && i < elements.length ; ++i) {
        var key = elements[i];
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

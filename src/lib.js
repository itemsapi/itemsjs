var _ = require('./../lib/lodash');
var helpers = require('./helpers');
var Fulltext = require('./fulltext');

/**
 * search by filters
 */
module.exports.search = function(items, input, configuration) {

  input = input || {};


  // responsible to filters items by aggregation values (processed input)
  // not sure now about the reason but probably performance
  var filtered_items = module.exports.items_by_aggregations(items, input.aggregations);

  var per_page = input.per_page || 12;
  var page = input.page || 1;

  if (input.sort) {
    filtered_items = module.exports.sorted_items(filtered_items, input.sort, configuration.sortings);
  }

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
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */
module.exports.aggregation = function(items, input, aggregations) {

  var per_page = input.per_page || 10;
  var page = input.page || 1;

  if (input.name && (!aggregations || !aggregations[input.name])) {
    throw new Error(`Please define aggregation "${input.name}" in config`);
  }

  var buckets = module.exports.buckets(items, input.name, aggregations[input.name], aggregations)

  if (input.query) {
    buckets = _.filter(buckets, val => {
      // responsible for query
      // counterpart to startsWith
      return val.key.toLowerCase().indexOf(input.query.toLowerCase()) === 0;
    });
  }

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: buckets.length
    },
    data: {
      buckets: buckets.slice((page - 1) * per_page, page * per_page),
    }
  }
}

/**
 * return items by sort
 */
module.exports.sorted_items = function(items, sort, sortings) {

  if (sortings[sort] && sortings[sort].field) {

    return _.orderBy(
      items,
      [sortings[sort].field],
      [sortings[sort].order || 'asc']
    );
  }

  return items;
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
 * should be is_filterable_item
 */
module.exports.filterable_item = function(item, aggregations) {

  var keys = _.keys(aggregations)

  for (var i = 0 ; i < keys.length ; ++i) {

    var key = keys[i]
    if (helpers.is_not_filters_agg(aggregations[key]) && !helpers.not_filters_field(item[key], aggregations[key].not_filters)) {
      return false;
    } else if (helpers.is_disjunctive_agg(aggregations[key]) && !helpers.disjunctive_field(item[key], aggregations[key].filters)) {
      return false;
    } else if (helpers.is_conjunctive_agg(aggregations[key]) && !helpers.conjunctive_field(item[key], aggregations[key].filters)) {
      return false;
    }
  }

  return true;

  /*return _.every(_.keys(aggregations), (key) => {

    if (helpers.is_disjunctive_agg(aggregations[key])) {
      return helpers.disjunctive_field(item[key], aggregations[key].filters);
    } else {
      return helpers.conjunctive_field(item[key], aggregations[key].filters);
    }
  });*/
}

/*
 * returns array of item key values only if they are passing aggregations criteria
 */
module.exports.bucket_field = function(item, aggregations, key) {

  let clone_aggregations = _.clone(aggregations);
  delete clone_aggregations[key];

  var clone_aggregations_keys = _.keys(clone_aggregations);
  var keys = _.keys(aggregations);

  /**
   * responsible for narrowing facets
   */
  for (var i = 0 ; i < keys.length ; ++i) {

    var it = keys[i]
    if (helpers.is_not_filters_agg(aggregations[it])) {

      if (!helpers.not_filters_field(item[it], aggregations[it].not_filters)) {
        //return ['Sport', 'Drama', 'History'];
        return [];
      }
    }
  }

  for (var i = 0 ; i < clone_aggregations_keys.length ; ++i) {

    var it = clone_aggregations_keys[i];

    if (helpers.is_disjunctive_agg(aggregations[it]) && !helpers.disjunctive_field(item[it], aggregations[it].filters)) {
      return [];
    } else if (helpers.is_conjunctive_agg(aggregations[it]) && !helpers.conjunctive_field(item[it], aggregations[it].filters)) {
      return [];
    }
  }

  if (helpers.is_disjunctive_agg(aggregations[key]) || helpers.includes(item[key], aggregations[key].filters)) {
    return item[key] ? _.flatten([item[key]]) : [];
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

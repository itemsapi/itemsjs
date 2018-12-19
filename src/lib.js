var _ = require('./../vendor/lodash');
var helpers = require('./helpers');
var Fulltext = require('./fulltext');

/**
 * search by filters
 */
module.exports.search = function(items, input, configuration, fulltext) {

  input = input || {};

  var search_time = 0;
  // make search by query first
  if (fulltext) {

    var search_start_time = new Date().getTime();
    items = fulltext.search(input.query);
    search_time = new Date().getTime() - search_start_time;
  }

  /**
   * making a items filtering after search and before faceting
   * after search because search is very fast (faster than O(n) while filtering is O(n) and faceting is like O(n x m))
   * the goal is to make a library more customizable for developers
   */
  if (input.filter instanceof Function) {
    items = items.filter(input.filter);
  }

  // @deprecated
  if (input.prefilter instanceof Function) {
    items = input.prefilter(items);
  }

  /**
   * responsible for filtering items by aggregation values (processed input)
   * not sure now about the reason but probably performance
   */
  var filtered_items = module.exports.items_by_aggregations(items, input.aggregations);

  var per_page = input.per_page || 12;
  var page = input.page || 1;

  /**
   * sorting items
   */
  var sorting_time = 0;
  if (input.sort) {
    var sorting_start_time = new Date().getTime();
    filtered_items = module.exports.sorted_items(filtered_items, input.sort, configuration.sortings);
    sorting_time = new Date().getTime() - sorting_start_time;
  }

  /**
   * calculating facets
   */
  var facets_start_time = new Date().getTime();
  var aggregations = module.exports.aggregations(items, input.aggregations);
  var facets_time = new Date().getTime() - facets_start_time;

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: filtered_items.length
    },
    timings: {
      facets: facets_time,
      search: search_time,
      sorting: sorting_time
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
  if (sortings && sortings[sort]) {
    sort = sortings[sort];
  }

  if (sort.field) {
    return _.orderBy(
      items,
      sort.field,
      sort.order || 'asc'
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
    if (helpers.is_empty_agg(aggregations[key])) {
      if (helpers.check_empty_field(item[aggregations[key].field], aggregations[key].filters)) {
        continue;
      }
      return false;
    } else if (helpers.is_not_filters_agg(aggregations[key]) && !helpers.not_filters_field(item[key], aggregations[key].not_filters)) {
      return false;
    } else if (helpers.is_disjunctive_agg(aggregations[key]) && !helpers.disjunctive_field(item[key], aggregations[key].filters)) {
      return false;
    } else if (helpers.is_conjunctive_agg(aggregations[key]) && !helpers.conjunctive_field(item[key], aggregations[key].filters)) {
      return false;
    }
  }

  return true;
}

/*
 * returns array of item key values only if they are passing aggregations criteria
 */
module.exports.bucket_field = function(item, aggregations, key) {

  var keys = _.keys(aggregations);

  /**
   * responsible for narrowing facets with not_filter filter
   */
  for (var i = 0 ; i < keys.length ; ++i) {

    var it = keys[i]
    if (helpers.is_not_filters_agg(aggregations[it])) {

      if (!helpers.not_filters_field(item[it], aggregations[it].not_filters)) {
        return [];
      }
    }
  }

  for (var i = 0 ; i < keys.length ; ++i) {

    if (keys[i] === key) {
      continue;
    }

    var it = keys[i];

    if (helpers.is_empty_agg(aggregations[it])) {
      if (!helpers.check_empty_field(item[aggregations[it].field], aggregations[it].filters)) {
        return [];
      } else {
        continue;
      }
    } else if (helpers.is_disjunctive_agg(aggregations[it]) && !helpers.disjunctive_field(item[it], aggregations[it].filters)) {
      return [];
    } else if (helpers.is_conjunctive_agg(aggregations[it]) && !helpers.conjunctive_field(item[it], aggregations[it].filters)) {
      return [];
    }

  }

  if (helpers.is_empty_agg(aggregations[key])) {
    var temp = helpers.check_empty_field(item[aggregations[key].field], aggregations[key].filters)

    if (temp) {
      return temp;
    }
    return [];
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

  if (agg.sort === 'term') {
    buckets = _.orderBy(buckets, ['key'], [agg.order || 'asc']);
  } else {
    buckets = _.orderBy(buckets, ['doc_count', 'key'], [agg.order || 'desc', 'asc']);
  }

  return buckets;
}

/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */
module.exports.similar = function(items, id, options) {

  var result = [];
  var per_page = options.per_page || 10;
  var minimum = options.minimum || 0;
  var page = options.page || 1;

  var item;

  for (var i = 0 ; i < items.length ; ++i) {
    if (items[i].id == id) {
      item = items[i];
      break;
    }
  }

  if (!options.field) {
    throw new Error(`Please define field in options`);
  }

  var field = options.field;
  var sorted_items = [];

  for (var i = 0 ; i < items.length ; ++i) {

    if (items[i].id !== id) {
      var intersection = _.intersection(item[field], items[i][field])

      if (intersection.length >= minimum) {
        sorted_items.push(items[i]);
        sorted_items[sorted_items.length - 1].intersection_length = intersection.length;
      }
    }
  }

  sorted_items = _.orderBy(
    sorted_items,
    ['intersection_length'],
    ['desc']
  );

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: sorted_items.length
    },
    data: {
      items: sorted_items.slice((page - 1) * per_page, page * per_page),
    }
  }
}

const _ = require('./../vendor/lodash');
const helpers = require('./helpers');
const FastBitSet = require('fastbitset');

/**
 * search by filters
 */
module.exports.search = function(items, input, configuration, fulltext, facets) {

  input = input || {};

  const per_page = parseInt(input.per_page || 12);
  const page = parseInt(input.page || 1);

  let search_time = 0;
  const total_time_start = new Date().getTime();
  let query_ids;

  // make search by query first
  if (fulltext) {

    const search_start_time = new Date().getTime();
    items = fulltext.search(input.query);
    search_time = new Date().getTime() - search_start_time;

    query_ids = new FastBitSet(items.map(v => v._id));
  }

  /**
   * making a items filtering after search and before faceting
   */
  let filter_time = new Date().getTime();
  if (input.filter instanceof Function) {
    items = items.filter(input.filter);
    query_ids = new FastBitSet(items.map(v => v._id));
  }

  filter_time = new Date().getTime() - filter_time;

  let facets_time = new Date().getTime();
  const facet_result = facets.search(input, {
    query_ids: query_ids
  });
  facets_time = new Date().getTime() - facets_time;

  let _ids_bitmap = fulltext.bits_ids();

  if (input.query || input.filter instanceof Function) {
    _ids_bitmap = query_ids;
  }

  let filtered_indexes_bitmap = _ids_bitmap;

  if (facet_result.ids) {
    filtered_indexes_bitmap = filtered_indexes_bitmap.new_intersection(facet_result.ids);
  }

  if (facet_result.not_ids) {
    filtered_indexes_bitmap = filtered_indexes_bitmap.new_difference(facet_result.not_ids);
  }

  // new filters to items
  // -------------------------------------

  const filtered_indexes = filtered_indexes_bitmap.array();

  const new_items_indexes = filtered_indexes.slice((page - 1) * per_page, page * per_page);
  let new_items;

  new_items = new_items_indexes.map(_id => {
    return fulltext.get_item(_id);
  });

  /**
   * sorting items
   */
  let sorting_time = 0;
  if (input.sort) {
    const sorting_start_time = new Date().getTime();
    new_items = module.exports.sorted_items(new_items, input.sort, configuration.sortings);
    sorting_time = new Date().getTime() - sorting_start_time;
  }

  const total_time = new Date().getTime() - total_time_start;

  //console.log(facet_result);

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: filtered_indexes.length
    },
    timings: {
      total: total_time,
      facets: facets_time,
      filter: filter_time,
      search: search_time,
      sorting: sorting_time
    },
    data: {
      items: new_items,
      //aggregations: aggregations,
      aggregations: helpers.getBuckets(facet_result, input, configuration.aggregations),
    }
  };
};

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
};

/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */
module.exports.similar = function(items, id, options) {

  const per_page = options.per_page || 10;
  const minimum = options.minimum || 0;
  const page = options.page || 1;

  let item;

  for (let i = 0 ; i < items.length ; ++i) {
    if (items[i].id == id) {
      item = items[i];
      break;
    }
  }

  if (!options.field) {
    throw new Error('Please define field in options');
  }

  const field = options.field;
  let sorted_items = [];

  for (let i = 0 ; i < items.length ; ++i) {

    if (items[i].id !== id) {
      const intersection = _.intersection(item[field], items[i][field]);

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
  };
};


/**
 * returns list of elements in specific facet
 * useful for autocomplete or list all aggregation options
 */
module.exports.aggregation = function (items, input, configuration, fulltext, facets) {
  const per_page = input.per_page || 10;
  const page = input.page || 1;

  //console.log(configuration);
  //console.log(input);
  if (input.name && (!configuration.aggregations || !configuration.aggregations[input.name])) {
    throw new Error('Please define aggregation "'.concat(input.name, '" in config'));
  }

  const search_input = helpers.clone(input);

  search_input.page = 1;
  search_input.per_page = 0;

  if (!input.name) {
    throw new Error('field name is required');
  }

  configuration.aggregations[input.name].size = 10000;

  const result = module.exports.search(items, search_input, configuration, fulltext, facets);
  const buckets = result.data.aggregations[input.name].buckets;

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: buckets.length
    },
    data: {
      buckets: buckets.slice((page - 1) * per_page, page * per_page)
    }
  };
};

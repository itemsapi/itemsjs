import { orderBy, intersection as _intersection } from 'lodash-es';
import FastBitSet from 'fastbitset';
import { getBuckets, clone } from './helpers.js';

/**
 * search by filters
 */
export function search(items, input, configuration, fulltext, facets) {
  input = input || Object.create(null);

  const normalizeNumber = (value) => {
    if (typeof value === 'number') {
      return value;
    }
    const parsed = parseInt(value, 10);
    return parsed;
  };

  let per_page = normalizeNumber(input.per_page);
  if (!Number.isFinite(per_page) || per_page < 0) {
    per_page = 12;
  }

  let page = normalizeNumber(input.page);
  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  // Allow per_page to be zero to support queries that only need aggregations
  if (per_page === 0) {
    page = 1;
  }
  const is_all_filtered_items = input.is_all_filtered_items || false;

  if (configuration.native_search_enabled === false && input.query) {
    throw new Error(
      'The "query" option is not working once native search is disabled'
    );
  }

  let search_time = 0;
  const total_time_start = new Date().getTime();
  let query_ids;
  // all ids bitmap
  let filtered_indexes_bitmap = facets.bits_ids();
  let _ids;
  let all_filtered_items;

  if (input._ids) {
    query_ids = new FastBitSet(input._ids);
    _ids = input._ids;
  } else if (input.ids) {
    _ids = facets.internal_ids_from_ids_map(input.ids);

    if (input.filter) {
      _ids = items
        .filter((v) => _ids.includes(v._id))
        .filter(input.filter)
        .map((v) => v._id);
    }
    //console.log(_ids);
    query_ids = new FastBitSet(_ids);
  } else if (fulltext && (input.query || input.filter)) {
    const search_start_time = new Date().getTime();
    _ids = fulltext.search(input.query, input.filter);
    search_time = new Date().getTime() - search_start_time;
    query_ids = new FastBitSet(_ids);
  }

  let facets_time = new Date().getTime();
  const facet_result = facets.search(input, {
    query_ids: query_ids,
  });
  facets_time = new Date().getTime() - facets_time;

  if (query_ids) {
    filtered_indexes_bitmap = query_ids;
  }

  if (facet_result.ids) {
    filtered_indexes_bitmap = filtered_indexes_bitmap.new_intersection(
      facet_result.ids,
    );
  }

  if (facet_result.not_ids) {
    filtered_indexes_bitmap = filtered_indexes_bitmap.new_difference(
      facet_result.not_ids,
    );
  }

  // new filters to items
  // -------------------------------------
  let filtered_indexes = filtered_indexes_bitmap.array();

  let filtered_items = filtered_indexes.map((_id) => {
    return facets.get_item(_id);
  });

  /**
   * sorting items
   */
  let paginationApplied = false;
  const sorting_start_time = new Date().getTime();
  let sorting_time = 0;
  if (input.sort) {
    filtered_items = sorted_items(
      filtered_items,
      input.sort,
      configuration.sortings,
    );
  } else {
    if (_ids) {
      filtered_indexes = _ids.filter((v) => {
        return filtered_indexes_bitmap.has(v);
      });

      const filtered_items_indexes = filtered_indexes.slice(
        (page - 1) * per_page,
        page * per_page,
      );
      filtered_items = filtered_items_indexes.map((_id) => {
        return facets.get_item(_id);
      });

      paginationApplied = true;
    }
  }
  // pagination
  if (!paginationApplied) {
    all_filtered_items = is_all_filtered_items ? filtered_items : null;
    filtered_items = filtered_items.slice(
      (page - 1) * per_page,
      page * per_page,
    );
  }

  sorting_time = new Date().getTime() - sorting_start_time;

  const total_time = new Date().getTime() - total_time_start;

  //console.log(facet_result);

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: filtered_indexes.length,
    },
    timings: {
      total: total_time,
      facets: facets_time,
      //filter: filter_time,
      search: search_time,
      sorting: sorting_time,
    },
    data: {
      items: filtered_items,
      allFilteredItems: all_filtered_items,
      //aggregations: aggregations,
      aggregations: getBuckets(facet_result, input, configuration.aggregations),
    },
  };
}

/**
 * return items by sort
 */
export function sorted_items(items, sort, sortings) {
  if (sortings && sortings[sort]) {
    sort = sortings[sort];
  }

  if (sort.field) {
    const fields = Array.isArray(sort.field) ? sort.field : [sort.field];
    const orders = Array.isArray(sort.order) ? sort.order : [sort.order || 'asc'];

    // push null/undefined to the end for each field by prefixing with a boolean iteratee
    const iteratees = [];
    const iterateeOrders = [];

    fields.forEach((field, idx) => {
      iteratees.push((item) => (item[field] === null || item[field] === undefined ? 1 : 0));
      iterateeOrders.push('asc'); // keep non-null before nulls

      iteratees.push(field);
      iterateeOrders.push(orders[idx] || 'asc');
    });

    return orderBy(items, iteratees, iterateeOrders);
  }

  return items;
}

/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */
export function similar(items, id, options) {
  options = options || Object.create(null);
  const per_page = options.per_page || 10;
  const minimum = options.minimum || 0;
  const page = options.page || 1;

  let item;

  for (let i = 0; i < items.length; ++i) {
    if (items[i].id == id) {
      item = items[i];
      break;
    }
  }

  if (!item) {
    return {
      pagination: {
        per_page: per_page,
        page: page,
        total: 0,
      },
      data: {
        items: [],
      },
    };
  }

  if (!options.field) {
    throw new Error('Please define field in options');
  }

  const field = options.field;
  let sorted_items = [];

  for (let i = 0; i < items.length; ++i) {
    if (items[i].id !== id) {
      const intersection = _intersection(item[field], items[i][field]);

      if (intersection.length >= minimum) {
        sorted_items.push({
          ...items[i],
          intersection_length: intersection.length,
        });
      }
    }
  }

  sorted_items = orderBy(sorted_items, ['intersection_length'], ['desc']);

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: sorted_items.length,
    },
    data: {
      items: sorted_items.slice((page - 1) * per_page, page * per_page),
    },
  };
}

/**
 * returns list of elements in specific facet
 * useful for autocomplete or list all aggregation options
 */
export function aggregation(items, input, configuration, fulltext, facets) {
  const per_page = input.per_page || 10;
  const page = input.page || 1;

  if (
    input.name &&
    (!configuration.aggregations || !configuration.aggregations[input.name])
  ) {
    throw new Error(
      'Please define aggregation "'.concat(input.name, '" in config'),
    );
  }

  const search_input = clone(input);

  search_input.page = 1;
  search_input.per_page = 0;

  if (!input.name) {
    throw new Error('field name is required');
  }

  const aggregationConfig = {
    ...configuration,
    aggregations: {
      ...configuration.aggregations,
      [input.name]: {
        ...configuration.aggregations[input.name],
        size: 10000,
      },
    },
  };

  const result = search(items, search_input, aggregationConfig, fulltext, facets);
  const buckets = result.data.aggregations[input.name].buckets;

  return {
    pagination: {
      per_page: per_page,
      page: page,
      total: buckets.length,
    },
    data: {
      buckets: buckets.slice((page - 1) * per_page, page * per_page),
    },
  };
}

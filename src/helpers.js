import {
  mapValues,
  clone as _clone,
  sortBy,
  isArray,
  orderBy,
  minBy,
  maxBy,
  sumBy,
  meanBy,
} from 'lodash-es';
import FastBitSet from 'fastbitset';
import booleanParser from 'boolean-parser';

export const clone = function (val) {
  try {
    return structuredClone(val);
  } catch (e) {
    try {
      return JSON.parse(JSON.stringify(val));
    } catch (e) {
      return val;
    }
  }
};

export const humanize = function (str) {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, function (m) {
      return m.toUpperCase();
    });
};

export const combination_indexes = function (facets, filters) {
  const indexes = Object.create(null);

  mapValues(filters, function (filter) {
    // filter is still array so disjunctive
    if (Array.isArray(filter[0])) {
      let facet_union = new FastBitSet([]);
      const filter_keys = [];

      mapValues(filter, function (disjunctive_filter) {
        const filter_key = disjunctive_filter[0];
        const filter_val = disjunctive_filter[1];

        filter_keys.push(filter_key);
        facet_union = facet_union.new_union(
          facets['bits_data'][filter_key][filter_val] || new FastBitSet([])
        );
        indexes[filter_key] = facet_union;
      });
    }
  });

  return indexes;
};

export const filters_matrix = function (facets, query_filters) {
  const temp_facet = _clone(facets);

  if (!temp_facet['is_temp_copied']) {
    mapValues(temp_facet['bits_data'], function (values, key) {
      mapValues(temp_facet['bits_data'][key], function (facet_indexes, key2) {
        temp_facet['bits_data_temp'][key][key2] =
          temp_facet['bits_data'][key][key2];
      });
    });
  }

  let union = null;

  /**
   * process only conjunctive filters
   */
  mapValues(query_filters, function (conjunction) {
    let conjunctive_index = null;

    mapValues(conjunction, function (filter) {
      const filter_key = filter[0];
      const filter_val = filter[1];

      if (!temp_facet['bits_data_temp'][filter_key]) {
        throw new Error('Panic. The key does not exist in facets lists.');
      }

      if (
        conjunctive_index &&
        temp_facet['bits_data_temp'][filter_key][filter_val]
      ) {
        conjunctive_index =
          temp_facet['bits_data_temp'][filter_key][filter_val].new_intersection(
            conjunctive_index
          );
      } else if (
        conjunctive_index &&
        !temp_facet['bits_data_temp'][filter_key][filter_val]
      ) {
        conjunctive_index = new FastBitSet([]);
      } else {
        conjunctive_index =
          temp_facet['bits_data_temp'][filter_key][filter_val];
      }
    });

    union = (union || new FastBitSet([])).new_union(
      conjunctive_index || new FastBitSet([])
    );
  });

  if (union !== null) {
    mapValues(temp_facet['bits_data_temp'], function (values, key) {
      mapValues(
        temp_facet['bits_data_temp'][key],
        function (facet_indexes, key2) {
          temp_facet['bits_data_temp'][key][key2] =
            temp_facet['bits_data_temp'][key][key2].new_intersection(union);
        }
      );
    });
  }

  return temp_facet;
};

/*
 * returns facets and ids
 */
export const matrix = function (facets, filters) {
  const temp_facet = _clone(facets);

  filters = filters || [];

  mapValues(temp_facet['bits_data'], function (values, key) {
    mapValues(temp_facet['bits_data'][key], function (facet_indexes, key2) {
      temp_facet['bits_data_temp'][key][key2] =
        temp_facet['bits_data'][key][key2];
    });
  });

  temp_facet['is_temp_copied'] = true;

  let conjunctive_index;
  const disjunctive_indexes = combination_indexes(facets, filters);

  /**
   * process only conjunctive filters
   */
  mapValues(filters, function (filter) {
    if (!Array.isArray(filter[0])) {
      const filter_key = filter[0];
      const filter_val = filter[1];

      if (
        conjunctive_index &&
        temp_facet['bits_data_temp'][filter_key][filter_val]
      ) {
        conjunctive_index =
          temp_facet['bits_data_temp'][filter_key][filter_val].new_intersection(
            conjunctive_index
          );
      } else if (
        conjunctive_index &&
        !temp_facet['bits_data_temp'][filter_key][filter_val]
      ) {
        conjunctive_index = new FastBitSet([]);
      } else {
        conjunctive_index =
          temp_facet['bits_data_temp'][filter_key][filter_val];
      }
    }
  });

  // cross all facets with conjunctive index
  if (conjunctive_index) {
    mapValues(temp_facet['bits_data_temp'], function (values, key) {
      mapValues(
        temp_facet['bits_data_temp'][key],
        function (facet_indexes, key2) {
          temp_facet['bits_data_temp'][key][key2] =
            temp_facet['bits_data_temp'][key][key2].new_intersection(
              conjunctive_index
            );
        }
      );
    });
  }

  /**
   * process only negative filters
   */
  mapValues(filters, function (filter) {
    if (filter.length === 3 && filter[1] === '-') {
      const filter_key = filter[0];
      const filter_val = filter[2];

      const negative_bits =
        temp_facet['bits_data_temp'][filter_key][filter_val].clone();

      mapValues(temp_facet['bits_data_temp'], function (values, key) {
        mapValues(
          temp_facet['bits_data_temp'][key],
          function (facet_indexes, key2) {
            temp_facet['bits_data_temp'][key][key2] =
              temp_facet['bits_data_temp'][key][key2].new_difference(
                negative_bits
              );
          }
        );
      });
    }
  });

  // cross all facets with disjunctive index
  mapValues(temp_facet['bits_data_temp'], function (values, key) {
    mapValues(
      temp_facet['bits_data_temp'][key],
      function (facet_indexes, key2) {
        mapValues(
          disjunctive_indexes,
          function (disjunctive_index, disjunctive_key) {
            if (disjunctive_key !== key) {
              temp_facet['bits_data_temp'][key][key2] =
                temp_facet['bits_data_temp'][key][key2].new_intersection(
                  disjunctive_index
                );
            }
          }
        );
      }
    );
  });

  return temp_facet;
};

export const index = function (items, fields) {
  fields = fields || [];

  const facets = {
    data: Object.create(null),
    bits_data: Object.create(null),
    bits_data_temp: Object.create(null),
  };

  let i = 1;

  items && items.map((item) => {
    if (!item['_id']) {
      item['_id'] = i;
      ++i;
    }

    return item;
  });

  items && items.map((item) => {
    fields.forEach((field) => {
      //if (!item || !item[field]) {
      if (!item) {
        return;
      }

      if (!facets['data'][field]) {
        facets['data'][field] = Object.create(null);
      }

      if (Array.isArray(item[field])) {
        item[field].forEach((v) => {
          if (!item[field]) {
            return;
          }

          if (!facets['data'][field][v]) {
            facets['data'][field][v] = [];
          }

          facets['data'][field][v].push(parseInt(item._id));
        });
      } else if (typeof item[field] !== 'undefined') {
        const v = item[field];

        if (!facets['data'][field][v]) {
          facets['data'][field][v] = [];
        }

        facets['data'][field][v].push(parseInt(item._id));
      }
    });

    return item;
  });

  facets['data'] = mapValues(facets['data'], function (values, field) {
    if (!facets['bits_data'][field]) {
      facets['bits_data'][field] = Object.create(null);
      facets['bits_data_temp'][field] = Object.create(null);
    }

    //console.log(values);
    return mapValues(values, function (indexes, filter) {
      const sorted_indexes = sortBy(indexes);
      facets['bits_data'][field][filter] = new FastBitSet(sorted_indexes);
      return sorted_indexes;
    });
  });

  return facets;
};

/**
 * calculates ids for filters
 */
export const filters_ids = function (facets_data) {
  let output = new FastBitSet([]);

  mapValues(facets_data, function (values, key) {
    mapValues(facets_data[key], function (facet_indexes, key2) {
      output = output.new_union(facets_data[key][key2]);
    });
  });

  return output;
};

/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't matched searched items
 */
export const facets_ids = function (facets_data, filters) {
  let output = new FastBitSet([]);
  let i = 0;

  mapValues(filters, function (filters, field) {
    filters.forEach((filter) => {
      ++i;
      output = output.new_union(
        facets_data[field][filter] || new FastBitSet([])
      );
    });
  });

  if (i === 0) {
    return null;
  }

  return output;
};

export const getBuckets = function (data, input, aggregations) {
  let position = 1;

  return mapValues(data['bits_data_temp'], (v, k) => {
    let order;
    let sort;
    let size;
    let title;
    let show_facet_stats;
    let chosen_filters_on_top;
    let hide_zero_doc_count;

    if (aggregations[k]) {
      order = aggregations[k].order;
      sort = aggregations[k].sort;
      size = aggregations[k].size;
      title = aggregations[k].title;
      show_facet_stats = aggregations[k].show_facet_stats || false;
      chosen_filters_on_top = aggregations[k].chosen_filters_on_top !== false;
      hide_zero_doc_count = aggregations[k].hide_zero_doc_count || false;
    }

    let buckets = Object.entries(v)
      .map((v2) => {
        let filters = [];

        if (input && input.filters && input.filters[k]) {
          filters = input.filters[k];
        }

        const doc_count = v2[1].array().length;

        //hide zero_doc_count facet only if it is not selected
        if (
          hide_zero_doc_count &&
          doc_count === 0 &&
          filters.indexOf(v2[0]) === -1
        ) {
          return;
        }

        return {
          key: v2[0],
          doc_count: doc_count,
          selected: filters.indexOf(v2[0]) !== -1,
        };
      })
      .filter(Boolean);

    let iteratees;
    let sort_order;

    if (isArray(sort)) {
      iteratees = sort || ['key'];
      sort_order = order || ['asc'];
    } else {
      if (sort === 'term' || sort === 'key') {
        iteratees = ['key'];
        sort_order = [order || 'asc'];
      } else {
        iteratees = ['doc_count', 'key'];
        sort_order = [order || 'desc', 'asc'];
      }

      if (chosen_filters_on_top) {
        iteratees.unshift('selected');
        sort_order.unshift('desc');
      }
    }

    buckets = orderBy(buckets, iteratees, sort_order);

    buckets = buckets.slice(0, size || 10);

    // Calculate the facet_stats
    let facet_stats;
    let calculated_facet_stats;

    if (show_facet_stats) {
      facet_stats = [];
      Object.entries(v).forEach((v2) => {
        if (isNaN(v2[0])) {
          throw new Error('You cant use chars to calculate the facet_stats.');
        }

        // Doc_count
        if (v2[1].array().length > 0) {
          v2[1].forEach((/*doc_count*/) => {
            facet_stats.push(parseInt(v2[0]));
          });
        }
      });

      calculated_facet_stats = {
        min: minBy(facet_stats),
        max: maxBy(facet_stats),
        avg: meanBy(facet_stats),
        sum: sumBy(facet_stats),
      };
    }

    return {
      name: k,
      title: title || humanize(k),
      position: position++,
      buckets: buckets,
      ...(show_facet_stats && { facet_stats: calculated_facet_stats }),
    };
  });
};

export const mergeAggregations = function (aggregations, input) {
  return mapValues(clone(aggregations), (val, key) => {
    if (!val.field) {
      val.field = key;
    }

    let filters = [];
    if (input.filters && input.filters[key]) {
      filters = input.filters[key];
    }

    val.filters = filters;

    let not_filters = [];
    if (input.not_filters && input.not_filters[key]) {
      not_filters = input.not_filters[key];
    }

    if (input.exclude_filters && input.exclude_filters[key]) {
      not_filters = input.exclude_filters[key];
    }

    val.not_filters = not_filters;

    return val;
  });
};

export const input_to_facet_filters = function (input, config) {
  const filters = [];

  mapValues(input.filters, function (values, key) {
    if (values && values.length) {
      if (config[key].conjunction !== false) {
        mapValues(values, function (values2) {
          filters.push([key, values2]);
        });
      } else {
        const temp = [];
        mapValues(values, function (values2) {
          temp.push([key, values2]);
        });

        filters.push(temp);
      }
    }
  });

  mapValues(input.not_filters, function (values, key) {
    if (values && values.length) {
      mapValues(values, function (values2) {
        filters.push([key, '-', values2]);
      });
    }
  });

  return filters;
};

export const parse_boolean_query = function (query) {
  const result = booleanParser.parseBooleanQuery(query);

  return result.map((v1) => {
    if (Array.isArray(v1)) {
      return v1.map((v2) => {
        if (Array.isArray(v2)) {
          return v2.map((v3) => {
            return v3;
          });
        } else {
          return v2.split(':');
        }
      });
    } else {
      return v1.split(':');
    }
  });
};

export const getFacets = getBuckets;

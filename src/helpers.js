import {
  mapValues,
  clone as _clone,
  isArray,
  orderBy,
  minBy,
  maxBy,
  sumBy,
  meanBy,
} from 'lodash-es';
import FastBitSet from 'fastbitset';
import booleanParser from 'boolean-parser';

export const clone = function(val) {
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

export const humanize = function(str) {
  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, function(m) {
      return m.toUpperCase();
    });
};

export const combination_indexes = function(facets, filters) {
  const indexes = {};

  filters.forEach(filter => {
    if (Array.isArray(filter[0])) {
      let facet_union = new FastBitSet();
      const filter_keys = new Set();

      filter.forEach(disjunctive_filter => {
        const [filter_key, filter_val] = disjunctive_filter;
        filter_keys.add(filter_key);
        const bits =
          facets.bits_data[filter_key]?.[filter_val] || new FastBitSet();
        facet_union = facet_union.new_union(bits);
      });

      filter_keys.forEach(filter_key => {
        indexes[filter_key] = facet_union;
      });
    }
  });

  return indexes;
};

export const filters_matrix = function(facets, query_filters) {
  // Używamy cloneDeepWith z niestandardową funkcją klonowania
  // const temp_facet = _.cloneDeepWith(facets, customClone);
  const temp_facet = _clone(facets);

  // Inicjalizujemy bits_data_temp, jeśli nie istnieje
  if (!temp_facet.bits_data_temp) {
    temp_facet.bits_data_temp = {};
  }

  if (!temp_facet.is_temp_copied) {
    for (const key in temp_facet.bits_data) {
      temp_facet.bits_data_temp[key] = {};
      for (const key2 in temp_facet.bits_data[key]) {
        temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data[key][key2];
      }
    }
  }

  let union = null;

  // Upewniamy się, że query_filters jest tablicą
  if (Array.isArray(query_filters)) {
    // Przetwarzanie filtrów koniunktywnych
    query_filters.forEach(conjunction => {
      let conjunctive_index = null;

      conjunction.forEach(filter => {
        const [filter_key, filter_val] = filter;

        if (!temp_facet.bits_data_temp[filter_key]) {
          throw new Error('Panic. The key does not exist in facets lists.');
        }

        const facetData = temp_facet.bits_data_temp[filter_key][filter_val];

        if (facetData) {
          if (conjunctive_index) {
            conjunctive_index = conjunctive_index.new_intersection(facetData);
          } else {
            conjunctive_index = facetData;
          }
        } else {
          conjunctive_index = new FastBitSet();
        }
      });

      if (conjunctive_index) {
        if (union) {
          union = union.new_union(conjunctive_index);
        } else {
          union = conjunctive_index;
        }
      }
    });
  }

  if (union !== null) {
    for (const key in temp_facet.bits_data_temp) {
      for (const key2 in temp_facet.bits_data_temp[key]) {
        temp_facet.bits_data_temp[key][key2] =
          temp_facet.bits_data_temp[key][key2].new_intersection(union);
      }
    }
  }

  return temp_facet;
};

export const matrix = function(facets, filters = []) {
  const temp_facet = _clone(facets);

  // Kopiujemy bits_data do bits_data_temp
  temp_facet.bits_data_temp = {};
  for (const key in temp_facet.bits_data) {
    temp_facet.bits_data_temp[key] = {};
    for (const key2 in temp_facet.bits_data[key]) {
      temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data[key][key2];
    }
  }

  temp_facet.is_temp_copied = true;

  let conjunctive_index;
  const disjunctive_indexes = combination_indexes(facets, filters);

  // Przetwarzanie filtrów koniunktywnych
  filters.forEach(filter => {
    if (!Array.isArray(filter[0])) {
      const [filter_key, filter_val] = filter;
      const facetData = temp_facet.bits_data_temp[filter_key]?.[filter_val];

      if (conjunctive_index && facetData) {
        conjunctive_index = facetData.new_intersection(conjunctive_index);
      } else if (conjunctive_index && !facetData) {
        conjunctive_index = new FastBitSet([]);
      } else {
        conjunctive_index = facetData;
      }
    }
  });

  // Krzyżujemy wszystkie fasety z indeksami koniunktywnymi
  if (conjunctive_index) {
    for (const key in temp_facet.bits_data_temp) {
      for (const key2 in temp_facet.bits_data_temp[key]) {
        temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data_temp[key][key2].new_intersection(conjunctive_index);
      }
    }
  }

  // Przetwarzanie filtrów negatywnych
  filters.forEach(filter => {
    if (filter.length === 3 && filter[1] === '-') {
      const [filter_key, , filter_val] = filter;
      const negative_bits = temp_facet.bits_data_temp[filter_key][filter_val].clone();

      for (const key in temp_facet.bits_data_temp) {
        for (const key2 in temp_facet.bits_data_temp[key]) {
          temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data_temp[key][key2].new_difference(negative_bits);
        }
      }
    }
  });

  // Krzyżujemy wszystkie fasety z indeksami dysjunktywnymi
  for (const key in temp_facet.bits_data_temp) {
    for (const key2 in temp_facet.bits_data_temp[key]) {
      for (const disjunctive_key in disjunctive_indexes) {
        if (disjunctive_key !== key) {
          temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data_temp[key][key2].new_intersection(disjunctive_indexes[disjunctive_key]);
        }
      }
    }
  }

  return temp_facet;
};

export const index = function(items = [], fields = []) {
  const facets = {
    data: Object.create(null),
    bits_data: Object.create(null),
    bits_data_temp: Object.create(null),
  };

  let nextId = 1;

  // Inicjalizujemy facets.data dla każdego pola
  fields.forEach(field => {
    facets.data[field] = Object.create(null);
  });

  // Przypisujemy _id do elementów bez tego identyfikatora
  items.forEach(item => {
    if (!item._id) {
      item._id = nextId++;
    }
  });

  // Budujemy facets.data
  items.forEach(item => {
    fields.forEach(field => {
      const fieldValue = item[field];

      if (Array.isArray(fieldValue)) {
        fieldValue.forEach(value => {
          if (!facets.data[field][value]) {
            facets.data[field][value] = [];
          }
          facets.data[field][value].push(item._id);
        });
      } else if (typeof fieldValue !== 'undefined') {
        const value = fieldValue;
        if (!facets.data[field][value]) {
          facets.data[field][value] = [];
        }
        facets.data[field][value].push(item._id);
      }
    });
  });

  // Budujemy facets.bits_data i facets.bits_data_temp
  Object.keys(facets.data).forEach(field => {
    facets.bits_data[field] = Object.create(null);
    facets.bits_data_temp[field] = Object.create(null);

    const values = facets.data[field];
    Object.keys(values).forEach(filter => {
      const indexes = values[filter];
      const sorted_indexes = indexes.sort((a, b) => a - b);
      facets.bits_data[field][filter] = new FastBitSet(sorted_indexes);
      // Aktualizujemy facets.data z posortowanymi indeksami
      facets.data[field][filter] = sorted_indexes;
    });
  });

  return facets;
};

/**
 * calculates ids for filters
 */
export const filters_ids = function(facets_data) {
  let output = new FastBitSet([]);

  mapValues(facets_data, function(values, key) {
    mapValues(facets_data[key], function(facet_indexes, key2) {
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
export const facets_ids = function(facets_data, filters) {
  let output = new FastBitSet([]);
  let i = 0;

  mapValues(filters, function(filters, field) {
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

export const getBuckets = function(data, input, aggregations) {
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

export const mergeAggregations = function(aggregations, input) {
  const result = {};

  for (const key in aggregations) {
    const val = { ...aggregations[key] };

    val.field = val.field || key;
    val.filters = (input.filters && input.filters[key]) || [];
    val.not_filters =
      (input.exclude_filters && input.exclude_filters[key]) ||
      (input.not_filters && input.not_filters[key]) ||
      [];

    result[key] = val;
  }

  return result;
};

export const input_to_facet_filters = function(input, config) {
  const filters = [];

  // Przetwarzanie filtrów pozytywnych
  for (const key in input.filters) {
    const values = input.filters[key];
    if (values && values.length) {
      if (config[key]?.conjunction !== false) {
        values.forEach(value => {
          filters.push([key, value]);
        });
      } else {
        const temp = values.map(value => [key, value]);
        filters.push(temp);
      }
    }
  }

  // Przetwarzanie filtrów negatywnych
  for (const key in input.not_filters) {
    const values = input.not_filters[key];
    if (values && values.length) {
      values.forEach(value => {
        filters.push([key, '-', value]);
      });
    }
  }

  return filters;
};

export const parse_boolean_query = function(query) {
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

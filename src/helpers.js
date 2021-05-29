const _ = require('./../vendor/lodash');
const FastBitSet = require('fastbitset');

const clone = function(val) {

  try {
    return JSON.parse(JSON.stringify(val));
  } catch (e) {
    return val;
  }
};

const humanize = function (str) {

  return str
    .replace(/^[\s_]+|[\s_]+$/g, '')
    .replace(/[_\s]+/g, ' ')
    .replace(/^[a-z]/, function(m) {
      return m.toUpperCase();
    });
};

/*
 * returns facets and ids
 */
const matrix = function(facets, filters) {
  const temp_facet = _.clone(facets);

  filters = filters || [];

  _.mapValues(temp_facet['bits_data'], function(values, key) {
    _.mapValues(temp_facet['bits_data'][key], function(facet_indexes, key2) {
      temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data'][key][key2];
    });
  });

  _.mapValues(filters, function(filter) {

    if (Array.isArray(filter[0])) {

      let union = new FastBitSet([]);
      let filter_keys = [];

      _.mapValues(filter, function(disjunctive_filter) {
        const filter_key = disjunctive_filter[0];
        const filter_val = disjunctive_filter[1];

        // @TODO make filter_keys unique
        filter_keys.push(filter_key);

        union = union.new_union(temp_facet['bits_data_temp'][filter_key][filter_val]);
      });

      const filter_key = 'a';

      _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
        _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

          if (filter_keys.indexOf(key) === -1) {
            temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_intersection(union);
          }
        });
      });


    } else {

      if (filter.length === 2) {

        const filter_key = filter[0];
        const filter_val = filter[1];

        _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
          _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

            if (!temp_facet['bits_data_temp'][filter_key][filter_val]) {
              temp_facet['bits_data_temp'][key][key2] = new FastBitSet([]);
            } else {
              temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_intersection(temp_facet['bits_data_temp'][filter_key][filter_val]);
            }

          });
        });

      // negation
      } else if (filter.length === 3 && filter[1] === '-') {

        const filter_key = filter[0];
        const filter_val = filter[2];

        const negative_bits = temp_facet['bits_data_temp'][filter_key][filter_val].clone();

        _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
          _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

            temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_difference(negative_bits);
          });
        });
      }

    }
  })

  _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
    _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {
      temp_facet['data'][key][key2] = temp_facet['bits_data_temp'][key][key2].array();
    });
  });

  return temp_facet;
}

/**
 * TODO change aggregations to fields
 */
const findex = function(items, aggregations) {

  const facets = {
    data: {},
    bits_data: {},
    bits_data_temp: {},
  };

  let i = 1;
  const fields = _.keys(aggregations);

  items = _.map(items, item => {

    if (!item['_id']) {
      item['_id'] = i;
      ++i;
    }

    return item;
  });


  // replace chain with forEach

  _.chain(items)
    .map(item => {

      fields.forEach(field => {

        //if (!item || !item[field]) {
        if (!item) {
          return;
        }

        if (!facets['data'][field]) {
          facets['data'][field] = {};
        }

        if (Array.isArray(item[field])) {
          item[field].forEach(v => {

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
    })
    .value();

  facets['data'] = _.mapValues(facets['data'], function(values, field) {

    if (!facets['bits_data'][field]) {
      facets['bits_data'][field] = {};
      facets['bits_data_temp'][field] = {};
    }

    //console.log(values);
    return _.mapValues(values, function(indexes, filter) {

      const sorted_indexes = _.sortBy(indexes);
      facets['bits_data'][field][filter] = new FastBitSet(sorted_indexes);
      return sorted_indexes;
    });
  });

  return facets;
};

/**
 * it calculates new indexes for each facet group
 * @TODO config should be in filters data already
 */
const combination = function(facets_data, input, config) {

  const output = {};

  const filters_array = _.map(input.filters, function(filter, key) {
    return {
      key: key,
      values: filter,
      conjunction: config[key].conjunction !== false,
    };
  });

  filters_array.sort(function(a, b) {
    return a.conjunction > b.conjunction ? 1 : -1;
  });

  // @TODO we could forEach here only by list of keys
  // @TODO we don't need full  facets_data. filters_data should be enough
  _.mapValues(facets_data, function(values, key) {

    _.map(filters_array, function(object) {

      const filters = object.values;
      const field = object.key;

      filters.forEach(filter => {

        let result;

        if ((config[key].conjunction === false && key !== field) || config[key].conjunction !== false) {

          if (!output[key]) {
            result = facets_data[field][filter];
          } else {
            if (config[field].conjunction !== false) {
              result = output[key].new_intersection(facets_data[field][filter]);
            } else {
              result = output[key].new_union(facets_data[field][filter]);
            }
          }
        }

        if (result) {
          output[key] = result;
        }
      });
    });
  });

  return output;
};

/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't crossed searched items
 */
const facets_ids = function(facets_data, filters) {

  let output = new FastBitSet([]);
  let i = 0;

  _.mapValues(filters, function(filters, field) {

    //console.log(facets_data);

    filters.forEach(filter => {

      ++i;
      output = output.new_union(facets_data[field][filter]);
    });
  });

  if (i === 0) {
    return null;
  }

  return output;
};

const getBuckets = function(data, input, aggregations) {

  let position = 1;

  return _.mapValues(data['bits_data_temp'], (v, k) => {

    let order;
    let sort;
    let size;
    let title;

    if (aggregations[k]) {
      order = aggregations[k].order;
      sort = aggregations[k].sort;
      size = aggregations[k].size;
      title = aggregations[k].title;
    }

    let buckets = _.chain(v)
      .toPairs().map(v2 => {

        let filters = [];

        if (input && input.filters && input.filters[k]) {
          filters = input.filters[k];
        }

        return {
          key: v2[0],
          doc_count: v2[1].array().length,
          selected: filters.indexOf(v2[0]) !== -1
        };
      })
      .value();

    if (sort === 'term') {
      buckets = _.orderBy(buckets, ['selected', 'key'], ['desc', order || 'asc']);
    } else {
      buckets = _.orderBy(buckets, ['selected', 'doc_count', 'key'], ['desc', order || 'desc', 'asc']);
    }

    buckets = buckets.slice(0, size || 10);

    return {
      name: k,
      title: title || humanize(k),
      position: position++,
      buckets: buckets
    };

  });
};

const mergeAggregations = function(aggregations, input) {

  return _.mapValues(clone(aggregations), (val, key) => {

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

const input_to_facet_filters = function(input, config) {

  let filters = [];

  _.mapValues(input.filters, function(values, key) {

    if (config[key].conjunction !== true) {

      let temp = [];
      _.mapValues(values, function(values2, key2) {
        temp.push([key, values2]);
      });

      filters.push(temp);

    } else {
      _.mapValues(values, function(values2, key2) {
        filters.push([key, values2]);
      });
    }
  });

  _.mapValues(input.not_filters, function(values, key) {
    _.mapValues(values, function(values2, key2) {
      filters.push([key, '-', values2]);
    });
  });

  return filters;
}

module.exports.input_to_facet_filters = input_to_facet_filters;
module.exports.facets_ids = facets_ids;
module.exports.clone = clone;
module.exports.humanize = humanize;
module.exports.combination = combination;
module.exports.index = findex;
module.exports.matrix = matrix;
module.exports.getBuckets = getBuckets;
module.exports.getFacets = getBuckets;
module.exports.mergeAggregations = mergeAggregations;

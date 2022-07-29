const _ = require('lodash');
const FastBitSet = require('fastbitset');
const booleanParser = require('boolean-parser');

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

const combination_indexes = function(facets, filters) {

  const indexes = {};

  _.mapValues(filters, function(filter) {

    // filter is still array so disjunctive
    if (Array.isArray(filter[0])) {

      let facet_union = new FastBitSet([]);
      const filter_keys = [];

      _.mapValues(filter, function(disjunctive_filter) {
        const filter_key = disjunctive_filter[0];
        const filter_val = disjunctive_filter[1];

        filter_keys.push(filter_key);
        facet_union = facet_union.new_union(facets['bits_data'][filter_key][filter_val]);
        indexes[filter_key] = facet_union;
      });
    }
  });

  return indexes;
};


const filters_matrix = function(facets, query_filters) {
  const temp_facet = _.clone(facets);

  if (!temp_facet['is_temp_copied']) {
    _.mapValues(temp_facet['bits_data'], function(values, key) {
      _.mapValues(temp_facet['bits_data'][key], function(facet_indexes, key2) {
        temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data'][key][key2];
      });
    });
  }

  let union = null; ;

  /**
   * process only conjunctive filters
   */
  _.mapValues(query_filters, function(conjunction) {

    let conjunctive_index = null;

    _.mapValues(conjunction, function(filter) {

      const filter_key = filter[0];
      const filter_val = filter[1];

      if (!temp_facet['bits_data_temp'][filter_key]) {
        throw new Error('Panic. The key does not exist in facets lists.')
      }


      if (conjunctive_index && temp_facet['bits_data_temp'][filter_key][filter_val]) {
        conjunctive_index = temp_facet['bits_data_temp'][filter_key][filter_val].new_intersection(conjunctive_index);
      } else if (conjunctive_index && !temp_facet['bits_data_temp'][filter_key][filter_val]) {
        conjunctive_index = new FastBitSet([]);
      } else {
        conjunctive_index = temp_facet['bits_data_temp'][filter_key][filter_val];
      }
    });

    union = (union || new FastBitSet([])).new_union(conjunctive_index || new FastBitSet([]));
  });

  if (union !== null) {

    _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {
        temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_intersection(union);
      });
    });
  }

  return temp_facet;
}



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

  temp_facet['is_temp_copied'] = true;

  let conjunctive_index;
  const disjunctive_indexes = combination_indexes(facets, filters);

  /**
   * process only conjunctive filters
   */
  _.mapValues(filters, function(filter) {

    if (!Array.isArray(filter[0])) {

      const filter_key = filter[0];
      const filter_val = filter[1];

      if (conjunctive_index && temp_facet['bits_data_temp'][filter_key][filter_val]) {
        conjunctive_index = temp_facet['bits_data_temp'][filter_key][filter_val].new_intersection(conjunctive_index);
      } else if (conjunctive_index && !temp_facet['bits_data_temp'][filter_key][filter_val]) {
        conjunctive_index = new FastBitSet([]);
      } else {
        conjunctive_index = temp_facet['bits_data_temp'][filter_key][filter_val];
      }
    }
  });


  // cross all facets with conjunctive index
  if (conjunctive_index) {
    _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {
        temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_intersection(conjunctive_index);
      });
    });
  }

  /**
   * process only negative filters
   */
  _.mapValues(filters, function(filter) {

    if (filter.length === 3 && filter[1] === '-') {

      const filter_key = filter[0];
      const filter_val = filter[2];

      const negative_bits = temp_facet['bits_data_temp'][filter_key][filter_val].clone();

      _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
        _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

          temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_difference(negative_bits);
        });
      });
    }
  });

  // cross all facets with disjunctive index
  _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
    _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {
      _.mapValues(disjunctive_indexes, function(disjunctive_index, disjunctive_key) {

        if (disjunctive_key !== key) {
          temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data_temp'][key][key2].new_intersection(disjunctive_index);
        }
      });
    });
  });

  return temp_facet;
};

const index = function(items, fields) {

  fields = fields || [];

  const facets = {
    data: {},
    bits_data: {},
    bits_data_temp: {},
  };

  let i = 1;

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
 * calculates ids for filters
 */
const filters_ids = function(facets_data) {

  let output = new FastBitSet([]);

  _.mapValues(facets_data, function(values, key) {
    _.mapValues(facets_data[key], function(facet_indexes, key2) {
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
const facets_ids = function(facets_data, filters) {

  let output = new FastBitSet([]);
  let i = 0;

  _.mapValues(filters, function(filters, field) {

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

    let buckets = _.chain(v)
      .toPairs().map(v2 => {

        let filters = [];

        if (input && input.filters && input.filters[k]) {
          filters = input.filters[k];
        }

        let doc_count = v2[1].array().length;

        if (hide_zero_doc_count && doc_count === 0) {
          return;
        }

        return {
          key: v2[0],
          doc_count: doc_count,
          selected: filters.indexOf(v2[0]) !== -1
        };
      })
      .compact()
      .value();

      let iteratees;
      let sort_order;

      if (_.isArray(sort)) {
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

      buckets = _.orderBy(buckets, iteratees, sort_order);

      buckets = buckets.slice(0, size || 10);

      // Calculate the facet_stats
      let facet_stats;
      let calculated_facet_stats;

      if(show_facet_stats) {
        facet_stats = [];
         _.chain(v)
          .toPairs().forEach(v2 => {
            if(isNaN(v2[0])) {
              throw new Error("You cant use chars to calculate the facet_stats.");
            }

            // Doc_count
            if(v2[1].array().length > 0) {
              v2[1].forEach(doc_count => {
                facet_stats.push(parseInt(v2[0]));
              });
            }
        })
        .value();

        calculated_facet_stats = {
          min: _.minBy(facet_stats),
          max: _.maxBy(facet_stats),
          avg: _.meanBy(facet_stats),
          sum: _.sumBy(facet_stats),
        };
      }

      return {
        name: k,
        title: title || humanize(k),
        position: position++,
        buckets: buckets,
        ...(show_facet_stats) && {facet_stats: calculated_facet_stats},
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

  const filters = [];

  _.mapValues(input.filters, function(values, key) {

    if (values && values.length) {
      if (config[key].conjunction !== false) {
        _.mapValues(values, function(values2) {
          filters.push([key, values2]);
        });
      } else {
        const temp = [];
        _.mapValues(values, function(values2) {
          temp.push([key, values2]);
        });

        filters.push(temp);
      }
    }
  });

  _.mapValues(input.not_filters, function(values, key) {
    if (values && values.length) {
      _.mapValues(values, function(values2) {
        filters.push([key, '-', values2]);
      });
    }
  });

  return filters;
};

const parse_boolean_query = function (query) {
  const result = parse_boolean_query_temp(query);
  return result;
}

const parse_boolean_query_temp = function (query) {

  const result = booleanParser.parseBooleanQuery(query);

  return _.map(result, v1 => {

    if (Array.isArray(v1)) {

      return _.map(v1, v2 => {
        if (Array.isArray(v2)) {
          return _.map(v2, v3 => {
            return v3;
          })
        } else {
          return v2.split(':');
        }
      })
    } else {
      return v1.split(':');
    }
  })
}

module.exports.parse_boolean_query = parse_boolean_query;
module.exports.input_to_facet_filters = input_to_facet_filters;
module.exports.facets_ids = facets_ids;
module.exports.filters_ids = filters_ids;
module.exports.clone = clone;
module.exports.humanize = humanize;
module.exports.index = index;
module.exports.combination_indexes = combination_indexes;
module.exports.matrix = matrix;
module.exports.filters_matrix = filters_matrix;
module.exports.getBuckets = getBuckets;
module.exports.getFacets = getBuckets;
module.exports.mergeAggregations = mergeAggregations;

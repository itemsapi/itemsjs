const _ = require('lodash');
const helpers = require('./helpers');
const FastBitSet = require('fastbitset');

/**
 * responsible for making faceted search
 */
const Facets = function(items, configuration) {

  configuration = configuration || {};
  configuration.aggregations = configuration.aggregations || {};
  this.items = items;
  this.config = configuration.aggregations;
  this.facets = helpers.index(items, _.keys(configuration.aggregations));

  this._items_map = {};
  this._ids = [];

  let i = 1;
  _.map(items, (item) => {
    this._ids.push(i);
    this._items_map[i] = item;
    item._id = i;
    ++i;
  });

  this.ids_map = {};

  if (items) {
    items.forEach(v => {

      const custom_id_field = configuration.custom_id_field || 'id';
      if (v[custom_id_field] && v._id) {
        this.ids_map[v[custom_id_field]] = v._id;
      }
    });
  }

  this._bits_ids = new FastBitSet(this._ids);
};

Facets.prototype = {

  items: function() {
    return this.items;
  },

  bits_ids: function(ids) {
    if (ids) {
      return new FastBitSet(ids);
    }
    return this._bits_ids;
  },

  internal_ids_from_ids_map: function(ids) {

    return ids.map(v => {
      return this.ids_map[v];
    });
  },

  index: function() {
    return this.facets;
  },

  get_item: function(_id) {
    return this._items_map[_id];
  },

  /*
   *
   * ids is optional only when there is query
   */
  search: function(input, data) {

    const config = this.config;
    data = data || {};

    // consider removing clone
    const temp_facet = _.clone(this.facets);

    temp_facet.not_ids = helpers.facets_ids(temp_facet['bits_data'], input.not_filters, config);

    let temp_data;

    const filters = helpers.input_to_facet_filters(input, config);
    temp_data = helpers.matrix(this.facets, filters);

    if (input.filters_query) {
      const filters = helpers.parse_boolean_query(input.filters_query);
      temp_data = helpers.filters_matrix(temp_data, filters);
    }

    temp_facet['bits_data_temp'] = temp_data['bits_data_temp'];

    _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

        if (data.query_ids) {
          temp_facet['bits_data_temp'][key][key2] = data.query_ids.new_intersection(temp_facet['bits_data_temp'][key][key2]);
        }

        if (data.test) {
          temp_facet['data'][key][key2] = temp_facet['bits_data_temp'][key][key2].array();
        }
      });
    });

    /**
     * calculating ids (for a list of items)
     * facets ids is faster and filter ids because filter ids makes union each to each filters
     * filter ids needs to be used if there is filters query
     */
    if (input.filters_query) {
      temp_facet.ids = helpers.filters_ids(temp_facet['bits_data_temp']);
    } else {
      temp_facet.ids = helpers.facets_ids(temp_facet['bits_data_temp'], input.filters);
    }

    return temp_facet;
  }
};

module.exports = Facets;

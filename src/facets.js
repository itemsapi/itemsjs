const _ = require('lodash');
const helpers = require('./helpers');
const FastBitSet = require('fastbitset');

/**
 * responsible for making faceted search
 */
const Facets = function(items, config) {

  config = config || {};
  this.items = items;
  this.config = config;
  this.facets = helpers.index(items, _.keys(config));

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
      if (v.id && v._id) {
        this.ids_map[v.id] = v._id;
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

    const filters = helpers.input_to_facet_filters(input, config);

    const temp_data = helpers.matrix(this.facets, filters);

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
     * calculating ids
     */
    temp_facet.ids = helpers.facets_ids(temp_facet['bits_data_temp'], input.filters, config);

    return temp_facet;
  }
};

module.exports = Facets;

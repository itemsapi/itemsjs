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
  this.facets = helpers.index(items, config);

  this._ids = [];

  let i = 1;
  _.map(items, (item) => {
    this._ids.push(i++);
  });
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

  index: function() {
    return this.facets;
  },

  reindex: function() {
    this.facets = helpers.index(this.items, this.config);

    return this.facets;
  },

  /*
   *
   * ids is optional only when there is query
   */
  search: function(input, data) {

    const config = this.config;
    data = data || {};
    // clone does not make sensee here
    const temp_facet = _.clone(this.facets);

    // working copy
    _.mapValues(temp_facet['bits_data'], function(values, key) {
      _.mapValues(temp_facet['bits_data'][key], function(facet_indexes, key2) {
        temp_facet['bits_data_temp'][key][key2] = temp_facet['bits_data'][key][key2];
      });
    });

    // -------------------------------
    //var time = new Date().getTime();
    const combination = helpers.combination(temp_facet['bits_data_temp'], input, config);
    //time = new Date().getTime() - time;
    //console.log('combination: ' + time);
    // -------------------------------



    /**
     * calculating not ids
     */
    temp_facet.not_ids = helpers.facets_ids(temp_facet['bits_data_temp'], input.not_filters, config);

    //console.log(temp_facet);

    /**
     * not filters calculations
     *
     */
    _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

        if (temp_facet.not_ids) {
          //var result = RoaringBitmap32.andNot(facet_indexes, temp_facet.not_ids);
          const result = facet_indexes.new_difference(temp_facet.not_ids);
          temp_facet['bits_data_temp'][key][key2] = result;
        }
      });
    });
    // -------------------------------

    _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

        if (combination[key]) {
          //temp_facet['bits_data_temp'][key][key2] = RoaringBitmap32.and(facet_indexes, combination[key]);
          temp_facet['bits_data_temp'][key][key2] = facet_indexes.new_intersection(combination[key]);
        }
      });
    });

    _.mapValues(temp_facet['bits_data_temp'], function(values, key) {
      _.mapValues(temp_facet['bits_data_temp'][key], function(facet_indexes, key2) {

        if (data.query_ids) {
          //temp_facet['bits_data_temp'][key][key2] = RoaringBitmap32.and(temp_facet['bits_data_temp'][key][key2], data.query_ids);
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

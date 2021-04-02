const service = require('./lib');
const helpers = require('./helpers');
const Fulltext = require('./fulltext');
const Facets = require('./facets');
const Storage = require('./storage');

module.exports = function itemsjs(items, configuration) {

  configuration = configuration || {};


  // upsert id to items
  // throw error in tests if id does not exists

  // responsible for full text search over the items
  // it makes inverted index and it is very fast
  // @todo should be optional
  let fulltext = new Fulltext(items, configuration);

  // index facets
  let facets = new Facets(items, configuration.aggregations);
  let storage = new Storage(items);

  return {
    /**
     * per_page
     * page
     * query
     * sort
     * filters
     */
    search: function(input) {
      input = input || {};

      /**
       * merge configuration aggregation with user input
       */
      input.aggregations = helpers.mergeAggregations(configuration.aggregations, input);

      return service.search(items, input, configuration, fulltext, facets);
    },

    /**
     * returns list of similar elements to specified item id
     * id
     */
    similar: function(id, options) {

      return service.similar(items, id, options);
    },

    /**
     * returns list of elements for specific aggregation i.e. list of tags
     * name (aggregation name)
     * query
     * per_page
     * page
     */
    aggregation: function(input) {
      return service.aggregation(items, input, configuration, fulltext, facets);
    },

    /**
     * reindex items
     * reinitialize fulltext search
     */
    reindex: function(newItems) {
      items = newItems;
      fulltext = new Fulltext(items, configuration);
      facets = new Facets(items, configuration.aggregations);
    }
  };
};

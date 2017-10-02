var service = require('./lib');
var helpers = require('./helpers');
var Fulltext = require('./fulltext');

module.exports = function itemsjs(items, configuration) {

  configuration = configuration || {};

  // responsible for full text search over the items
  // it makes inverted index and it is very fast
  var fulltext = new Fulltext(items, configuration);

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

      return service.search(items, input, configuration, fulltext);
    },

    /**
     * returns list of elements for specific aggregation i.e. list of tags
     * name (aggregation name)
     * query
     * per_page
     * page
     */
    aggregation: function(input) {

      return service.aggregation(items, input, configuration.aggregations);
    },

    /**
     * reindex items
     * reinitialize fulltext search
     */
    reindex: function(newItems) {
      items = newItems;
      fulltext = new Fulltext(items, configuration);
    }
  }
}

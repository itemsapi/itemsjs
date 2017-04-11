var service = require('./lib');
var _ = require('lodash');
var Fulltext = require('./fulltext');

module.exports = function itemsjs(items, configuration) {

  configuration = configuration || {};

  // responsible for full text search over the items
  // it makes inverted index and it is very fast
  var fulltext = new Fulltext(items);

  return {
    /**
     * per_page
     * page
     * filters
     */
    search: function(input) {
      input = input || {};

      // make search by query first
      items = fulltext.search(input.query);

      // convert input and create aggregations
      // based on user input and search configuration
      input.aggregations = _.mapValues((configuration.aggregations), (val, key) => {
        if (input.filters && input.filters[key]) {
          val.filters = input.filters[key];
        } else {
          val.filters = [];
        }
        return val;
      });

      return service.search(items, input)
    }
  }
}

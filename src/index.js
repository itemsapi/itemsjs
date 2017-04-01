var service = require('./lib');
var _ = require('lodash');

module.exports = function(items, configuration) {

  return {
    /**
     * per_page
     * page
     * filters
     */
    search: function(options) {
      //filters={"tags":["prison"],"genres":["Drama"]}
      options = options || {};
      options.aggregations = _.mapValues((options.filters), (val, key) => {
        return {
          filters: val
        }
      });

      return service.search(items, options)
    }
  }
}

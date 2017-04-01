var service = require('./lib');

module.exports = function(items, configuration) {

  return {
    search: function(options) {
      return service.search(items, options)
    }
  }
}

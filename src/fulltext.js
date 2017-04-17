var _ = require('lodash');
var lunr = require('lunr');

/**
 * responsible for making full text searching on items
 */
var Fulltext = function(items, config) {

  config = config || {};
  config.searchableFields = config.searchableFields || [];
  this.items = items;
  // creating index
  this.idx = lunr(function () {
    // currently schema hardcoded
    this.field('name', { boost: 10 });

    var self = this;
    _.forEach(config.searchableFields, function(field) {
      self.field(field);
    });
    this.ref('id');
  })
  //var items2 = _.clone(items)
  var i = 1;
  _.map(items, (doc) => {

    if (!doc.id) {
      doc.id = i;
      ++i;
    }
    this.idx.add(doc)
  })

  this.store = _.mapKeys(items, (doc) => {
    return doc.id;
  })
};

Fulltext.prototype = {

  search: function(query) {
    if (!query) {
      return this.items;
    }
    return _.map(this.idx.search(query), (val) => {
      var item = this.store[val.ref]
      delete item.id;
      return item;
    })
  }
}

module.exports = Fulltext;

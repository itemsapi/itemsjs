var _forEach = require('lodash/forEach');
var _map = require('lodash/map');
var _mapKeys = require('lodash/mapKeys');
var lunr = require('lunr');

/**
 * responsible for making full text searching on items
 * config provide only searchableFields
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
    _forEach(config.searchableFields, function(field) {
      self.field(field);
    });
    this.ref('id');
  })
  //var items2 = _.clone(items)
  var i = 1;
  _map(items, (doc) => {

    if (!doc.id) {
      doc.id = i;
      ++i;
    }
    this.idx.add(doc)
  })

  this.store = _mapKeys(items, (doc) => {
    return doc.id;
  })
};

Fulltext.prototype = {

  search: function(query) {
    if (!query) {
      return this.items;
    }
    return _map(this.idx.search(query), (val) => {
      var item = this.store[val.ref]
      //delete item.id;
      return item;
    })
  }
}

module.exports = Fulltext;

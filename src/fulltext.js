const _ = require('lodash');
const lunr = require('lunr');
const FastBitSet = require('fastbitset');

/**
 * responsible for making full text searching on items
 * config provide only searchableFields
 */
const Fulltext = function(items, config) {

  config = config || {};
  config.searchableFields = config.searchableFields || [];
  this.items = items;
  // creating index
  this.idx = lunr(function () {
    // currently schema hardcoded
    this.field('name', { boost: 10 });

    const self = this;
    _.forEach(config.searchableFields, function(field) {
      self.field(field);
    });
    this.ref('id');

    /**
     * Remove the stemmer and stopWordFilter from the pipeline
     * stemmer: https://github.com/olivernn/lunr.js/issues/328
     * stopWordFilter: https://github.com/olivernn/lunr.js/issues/233
     */
    if (config.isExactSearch) {
      this.pipeline.remove(lunr.stemmer);
      this.pipeline.remove(lunr.stopWordFilter);
    }
  });
  //var items2 = _.clone(items)
  let i = 1;
  this._items_map = {};
  this._ids = [];

  _.map(items, (item) => {

    this._items_map[i] = item;
    this._ids.push(i);
    item._id = i;

    if (!item.id) {
      item.id = i;
    }

    ++i;
    this.idx.add(item);
  });

  //this._bits_ids = new RoaringBitmap32(this._ids);
  this._bits_ids = new FastBitSet(this._ids);

  this.store = _.mapKeys(items, (doc) => {
    return doc.id;
  });
};

Fulltext.prototype = {

  internal_ids: function() {
    return this._ids;
  },

  bits_ids: function(ids) {

    if (ids) {
      return new FastBitSet(ids);
    }

    return this._bits_ids;
  },

  get_item: function(id) {
    return this._items_map[id];
  },

  search: function(query) {
    if (!query) {
      return this.items || [];
    }
    return _.map(this.idx.search(query), (val) => {
      const item = this.store[val.ref];
      //delete item.id;
      return item;
    });
  }
};

module.exports = Fulltext;

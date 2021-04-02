const _ = require('lodash');
const helpers = require('./helpers');
const FastBitSet = require('fastbitset');

/**
 * storing items and bits ids
 */
const Storage = function(items) {

  this.items = items;
  this._ids = [];

  let i = 1;
  _.map(items, (item) => {
    this._ids.push(i++);
  });
};

Storage.prototype = {

  bits_ids: function(ids) {
    if (ids) {
      return new FastBitSet(ids);
    }
    return this._bits_ids;
  },

  get_items: function(_id) {
    return this.items;
  },

  get_item: function(_id) {
    return this._items_map[_id];
  },
}

module.exports = Storage;

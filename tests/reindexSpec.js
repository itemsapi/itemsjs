'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');

describe('itemjs general tests', function() {

  var items = [{
    name: 'movie1',
    tags: ['a', 'b', 'c', 'd'],
    actors: ['a', 'b']
  }, {
    id: 10,
    name: 'movie2',
    tags: ['a', 'e', 'f'],
    actors: ['a', 'b']
  }, {
    name: 'movie3',
    tags: ['a', 'c'],
    actors: ['e']
  }]

  var itemsjs = require('./../src/index')(items, {
    searchableFields: ['name']
  });

  it('makes search', function test(done) {
    var result = itemsjs.search();
    assert.equal(result.data.items.length, 3);

    var result = itemsjs.search({
      query: 'movie3'
    });
    assert.equal(result.data.items.length, 1);

    itemsjs.reindex(items.slice(0, 2));
    var result = itemsjs.search();
    assert.equal(result.data.items.length, 2);

    var result = itemsjs.search({
      query: 'movie1'
    });
    assert.equal(result.data.items.length, 1);

    var result = itemsjs.search({
      query: 'movie3'
    });
    assert.equal(result.data.items.length, 0);
    done();
  });

});

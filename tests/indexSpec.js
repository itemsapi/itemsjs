'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');

describe('aggregations', function() {

  var items = [{
    name: 'movie1',
    tags: ['a', 'b', 'c', 'd'],
    actors: ['a', 'b']
  }, {
    name: 'movie2',
    tags: ['a', 'e', 'f'],
    actors: ['a', 'b']
  }, {
    name: 'movie3',
    tags: ['a', 'c'],
    actors: ['e']
  }]

  var itemsjs = require('./../src/index')(items);

  it('makes search', function test(done) {
    var result = itemsjs.search();
    assert.equal(result.data.items.length, 3);
    done();
  });

  it('makes search with pagination', function test(done) {
    var result = itemsjs.search({
      per_page: 1
    });
    assert.equal(result.data.items.length, 1);

    var result = itemsjs.search({
      per_page: 1,
      page: 4
    });
    assert.equal(result.data.items.length, 0);

    var result = itemsjs.search({
      per_page: 1,
      page: 3
    });
    assert.equal(result.data.items.length, 1);
    done();
  });

  it('makes search with aggregation filters', function test(done) {
    var result = itemsjs.search({
      filters: {
        tags: ['e', 'f']
      }
    });
    assert.equal(result.data.items.length, 1);

    var result = itemsjs.search({
      filters: {
        tags: ['e', 'f'],
        actors: ['a', 'b']
      }
    });
    assert.equal(result.data.items.length, 1);

    var result = itemsjs.search({
      filters: {
        tags: ['e', 'f'],
        actors: ['a', 'd']
      }
    });
    assert.equal(result.data.items.length, 0);
    done();
  });

});

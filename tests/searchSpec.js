'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');

describe('aggregations', function() {

  var items = [{
    name: 'movie1',
    rating: 10,
    tags: ['a', 'b', 'c', 'd'],
    actors: ['a', 'b']
  }, {
    name: 'movie2',
    rating: 9,
    tags: ['a', 'e', 'f'],
    actors: ['a', 'b']
  }, {
    name: 'movie3',
    rating: 8,
    tags: ['a', 'c'],
    actors: ['e']
  }]

  it('makes search', function test(done) {
    var result = service.search(items);
    assert.equal(result.data.items.length, 3);
    done();
  });

  it('makes search with filtering', function test(done) {
    var result = service.search(items, {
      filter: function(v) {
        return v.rating >= 9;
      }
    });

    assert.equal(result.data.items.length, 2);
    done();
  });

  it('makes search with pagination', function test(done) {
    var result = service.search(items, {
      per_page: 1
    });
    assert.equal(result.data.items.length, 1);

    var result = service.search(items, {
      per_page: 1,
      page: 4
    });
    assert.equal(result.data.items.length, 0);

    var result = service.search(items, {
      per_page: 1,
      page: 3
    });
    assert.equal(result.data.items.length, 1);
    done();
  });


  it('makes search with aggregations', function test(done) {

    var result = service.search(items, {
      aggregations: {
        tags: {
          filters: ['e', 'f'],
        }
      }
    });
    assert.equal(result.data.items.length, 1);
    done();

  });


});

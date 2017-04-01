'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');

describe('bucket', function() {

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

  it('filters items by aggregations', function test(done) {
    var result = service.items_by_aggregations(items, {
      tags: {},
      actors: {}
    })

    assert.equal(result.length, 3);
    done();
  });

  it('has aggregateable item', function test(done) {
    assert.equal(service.aggregateable_item(items[0], {
      tags: {},
      actors: {}
    }), true);

    assert.equal(service.aggregateable_item(items[0], {
      tags: {
        filters: ['f']
      },
      actors: {}
    }), false);

    assert.equal(service.aggregateable_item(items[0], {
      tags: {
        filters: ['a']
      },
      actors: {
        filters: ['a']
      }
    }), true);

    done();
  });

  it('filters items by aggregations', function test(done) {
    var result = service.items_by_aggregations(items, {
      tags: {
        filters: ['f']
      },
      actors: {}
    })

    assert.equal(result.length, 1);
    done();
  });

});

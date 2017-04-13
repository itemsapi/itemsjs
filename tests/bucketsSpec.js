'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');

describe('buckets', function() {

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

  it('returns aggregated fields for items', function test(done) {
    var result = service.buckets(items, 'tags', {
      size: 5,
      title: 'Tags'
    }, {
      tags: {
        size: 5,
        title: 'Tags'
      }
    });

    assert.equal(result.length, 6);
    assert.equal(result[0].key, 'a');
    assert.equal(result[0].doc_count, 3);

    done();
  });

  it('returns aggregated fields for items with non array field', function test(done) {
    var items = [{
      name: 'movie1',
      tags: 'a',
    }, {
      name: 'movie2',
      tags: 'a',
    }, {
      name: 'movie3',
      tags: ['a'],
    }]

    var result = service.buckets(items, 'tags', {
      size: 5,
      title: 'Tags'
    }, {
      tags: {
        size: 5,
        title: 'Tags'
      }
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].key, 'a');
    assert.equal(result[0].doc_count, 3);

    done();
  });

});

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
      title: 'Tags'
    }, {
      tags: {
        title: 'Tags'
      }
    });

    assert.equal(result.length, 6);
    assert.equal(result[0].key, 'a');
    assert.equal(result[0].doc_count, 3);

    done();
  });

  it('returns aggregated fields for items with filters as non conjuction', function test(done) {
    var result = service.buckets(items, 'tags', {
      filters: ['a', 'e'],
    }, {
      tags: {
      }
    });

    assert.equal(result.length, 3);
    assert.equal(result[0].key, 'a');
    assert.equal(result[0].doc_count, 1);
    assert.equal(result[1].key, 'e');
    assert.equal(result[1].doc_count, 1);
    assert.equal(result[2].key, 'f');
    assert.equal(result[2].doc_count, 1);

    done();
  });

  it('returns aggregated fields for items with disjunctive filter', function test(done) {
    var result = service.buckets(items, 'tags', {
      filters: ['a', 'e'],
      conjunction: false
    }, {
      tags: {
      }
    });

    assert.equal(result.length, 6);
    done();
  });

  it('returns aggregated fields for items with non array field (filters is empty)', function test(done) {
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
      title: 'Tags'
    }, {
      tags: {
        title: 'Tags'
      }
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].key, 'a');
    assert.equal(result[0].doc_count, 3);

    done();
  });

});

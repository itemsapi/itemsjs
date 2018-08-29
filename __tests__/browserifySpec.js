'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var ItemsJS = require('../src/index');

describe('itemjs general tests', function() {

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

  var itemsjs = ItemsJS(items);

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

    var itemsjs = ItemsJS(items, {
      aggregations: {
        tags: {},
        actors: {}
      }
    });

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

    var result = itemsjs.search();
    assert.equal(result.data.items.length, 3);
    done();
  });

  it('makes aggregations when configuration supplied', function test(done) {
    var itemsjs = ItemsJS(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    var result = itemsjs.search({});
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 6);
    done();
  });

  it('makes aggregations for non array (string) fields', function test(done) {
    var items = [{
      name: 'movie1',
      tags: 'a',
    }, {
      name: 'movie2',
      tags: 'a',
    }, {
      name: 'movie3',
      tags: 'a',
    }];

    var itemsjs = ItemsJS(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    var result = itemsjs.search({});
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 1);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 3);
    done();
  });

  it('makes aggregations for undefined field', function test(done) {
    var items = [{
      name: 'movie1',
    }, {
      name: 'movie2',
    }, {
      name: 'movie3',
    }];

    var itemsjs = ItemsJS(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    var result = itemsjs.search({});
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 0);
    //assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 3);
    done();
  });

  it('search by tags', function test(done) {
    var items = [{
      name: 'movie1',
      tags: ['drama']
    }, {
      name: 'movie2',
      tags: ['drama', 'crime']
    }, {
      name: 'movie3',
    }];

    var itemsjs = ItemsJS(items, {
      searchableFields: ['name', 'tags']
    });
    var result = itemsjs.search({
      query: 'drama'
    });
    assert.equal(result.data.items.length, 2);

    var result = itemsjs.search({
      query: 'crime'
    });
    assert.equal(result.data.items.length, 1);
    done();
  });

});

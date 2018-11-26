'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');

describe('itemjs general tests', function() {

  var items = [{
    name: 'movie1',
    rating: 8,
    tags: ['a', 'b', 'c', 'd'],
    actors: ['a', 'b']
  }, {
    id: 10,
    name: 'movie2',
    rating: 9,
    tags: ['a', 'e', 'f'],
    actors: ['a', 'b']
  }, {
    name: 'movie3',
    rating: 9,
    tags: ['a', 'c'],
    actors: ['e']
  }]

  var itemsjs = require('./../src/index')(items, {
    aggregations: {
      tags: {
        size: 10
      }
    }
  });

  it('checks aggregations', function test(done) {
    var result = itemsjs.aggregation({
      name: 'tags'
    });

    assert.equal(result.data.buckets.length, 6);
    assert.equal(result.data.buckets[0].key, 'a');
    assert.equal(result.data.buckets[0].doc_count, 3);
    done();
  });

  it('checks aggregation with undefined aggregation', function test(done) {

    try {
      itemsjs.aggregation({
        name: 'colors'
      });
    } catch (e) {
      assert.ok(e.message.indexOf('Please define aggregation') !== -1);
      done();
    }
  });

  it('makes search', function test(done) {
    var result = itemsjs.search();
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.items[0].id, 1);
    assert.equal(result.data.items[1].id, 10);
    assert.equal(result.data.items[2].id, 2);
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

  it('makes search with filtering', function test(done) {
    var result = itemsjs.search({
      filter: function(item) {
        return item.rating === 8;
      }
    });
    assert.equal(result.data.items.length, 1);
    done();
  });

  it('makes search with prefilter', function test(done) {
    var result = itemsjs.search({
      prefilter: function(items) {
        return items.slice(0, 1);
      }
    });
    assert.equal(result.data.items.length, 1);
    done();
  });

  it('makes search with aggregation filters', function test(done) {

    var itemsjs = require('./../src/index')(items, {
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
    var itemsjs = require('./../src/index')(items, {
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

  it('makes search aggregations and keep original configuration', function test(done) {

    var items = [{
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }, {
      id: 10,
      name: 'movie2',
      tags: ['a', 'e', 'f'],
      actors: ['a', 'b', 'c', 'd', 'e', 'f']
    }, {
      name: 'movie3',
      tags: ['a', 'c'],
      actors: ['e']
    }]

    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
        },
        actors: {
          type: 'terms',
          size: 10,
        }
      }
    });
    var result = itemsjs.search({
      filters: {
        tags: ['c']
      }
    });
    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 4);

    var result = itemsjs.aggregation({
      name: 'actors',
      per_page: 10
    });

    assert.equal(result.data.buckets.length, 6);
    done();
  });

  it('makes aggregations when configuration supplied and input provided', function test(done) {
    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    var result = itemsjs.search({
      filters: {
        tags: ['a']
      }
    });
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 6);

    var result = itemsjs.search({
      filters: {
        tags: ['a', 'z']
      }
    });
    assert.equal(result.data.items.length, 0);
    assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 0);

    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          conjunction: false,
          title: 'Tags'
        },
      }
    });

    var result = itemsjs.search({
      filters: {
        tags: ['a', 'c']
      }
    });
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

    var itemsjs = require('./../src/index')(items, {
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

    var itemsjs = require('./../src/index')(items, {
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

    var itemsjs = require('./../src/index')(items, {
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

'use strict';

const assert = require('assert');
const items = require('./fixtures/items.json');
let itemsjs = require('./../src/index')();

describe('search', function() {

  const configuration = {
    searchableFields: ['name', 'category', 'actors', 'name'],
    aggregations: {
      tags: {
        title: 'Tags',
        conjunction: true,
      },
      actors: {
        title: 'Actors',
        conjunction: true,
      },
      category: {
        title: 'Category',
        conjunction: true,
      }
    }
  };

  it('index is empty so cannot search', function test(done) {

    try {
      itemsjs.search();
    } catch (err) {
      assert.equal(err.message, 'index first then search');
    }

    done();
  });

  it('searches with two filters', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      filters: {
        tags: ['a'],
        category: ['drama']
      }
    });

    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 2);

    done();
  });

  it('searches with filter and query', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      filters: {
        tags: ['a'],
      },
      query: 'comedy'
    });

    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 2);
    assert.equal(result.data.aggregations.category.buckets[0].key, 'comedy');
    assert.equal(result.data.aggregations.category.buckets[0].doc_count, 2);

    done();
  });


  it('makes search with empty filters', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      filters: {
      }
    });

    assert.equal(result.data.items.length, 4);

    done();
  });

  it('makes search with not filters', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      not_filters: {
        tags: ['c']
      }
    });

    assert.equal(result.data.items.length, 1);

    done();
  });

  it('makes search with many not filters', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      not_filters: {
        tags: ['c', 'e']
      }
    });

    assert.equal(result.data.items.length, 0);

    done();
  });
});


describe('no configuration', function() {

  const configuration = {
    aggregations: {
    }
  };

  before(function(done) {
    itemsjs = require('./../index')(items, configuration);
    done();
  });

  it('searches with two filters', function test(done) {

    const result = itemsjs.search({
    });

    assert.equal(result.data.items.length, 4);

    done();
  });

  it('searches with filter', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    let result = itemsjs.search({
      filter: function() {
        return false;
      }
    });

    assert.equal(result.data.items.length, 0);

    result = itemsjs.search({
    });

    assert.equal(result.data.items.length, 4);
    done();
  });

});

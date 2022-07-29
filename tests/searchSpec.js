'use strict';

const assert = require('assert');
const items = require('./fixtures/items.json');
const movies = require('./fixtures/movies.json');
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
      year: {
        title: 'Year',
        conjunction: true,
      },
      in_cinema: {
        title: 'Is played in Cinema',
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

  it('searches no params', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
    });

    assert.equal(result.data.items.length, 4);
    assert.deepEqual(result.data.items[0].category, 'drama');
    assert.deepEqual(result.data.items[0].year, 1995);
    assert.deepEqual(result.data.items[0].in_cinema, false);


    assert.deepEqual(result.data.items[0].in_cinema, false);
    assert.equal(result.data.aggregations.in_cinema.buckets[0].doc_count, 3);
    assert.equal(result.data.aggregations.in_cinema.buckets[1].doc_count, 1);
    assert.equal(result.data.aggregations.in_cinema.buckets.length, 2);

    //console.log(result.data.aggregations.category);
    //console.log(result.data.aggregations.in_cinema);
    //console.log(result.data.aggregations.year);
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

  it('searches with filters query', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      filters_query: 'tags:c'
    });

    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 3);

    done();
  });

  it('searches with filters query and filters', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      filters_query: 'tags:c',
      filters: {
        tags: ['z']
      }
    });

    assert.equal(result.data.items.length, 1);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 1);

    done();
  });


  it('searches with filters query not existing value', function test(done) {

    const itemsjs = require('./../index')(items, configuration);

    const result = itemsjs.search({
      filters_query: 'tags:not_existing'
    });

    assert.equal(result.data.items.length, 0);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 0);

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

  it('throws an error if name does not exist', function test(done) {

    const itemsjs = require('./../index')(items, {
      native_search_enabled: false
    });

    try {
      itemsjs.search({
        query: 'xxx'
      });
    } catch (err) {
      assert.equal(err.message, '"query" and "filter" options are not working once native search is disabled');
    }

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

describe('custom fulltext integration', function() {

  const configuration = {
    aggregations: {
      tags: {},
      year: {}
    }
  };

  before(function(done) {
    itemsjs = require('./../index')(movies, configuration);
    done();
  });

  it('makes faceted search after separated quasi fulltext with _ids', function test(done) {

    let i = 1;
    const temp_movies = movies.map(v => {

      v._id = i++;
      return v;
    });

    const result = itemsjs.search({
      _ids: temp_movies.map(v => v._id).slice(0, 1)
    });

    assert.equal(result.data.items.length, 1);
    done();
  });

  it('makes faceted search after separated quasi fulltext with ids', function test(done) {

    let i = 10;
    const temp_movies = movies.map(v => {

      v.id = i;
      i += 10;
      return v;
    });

    itemsjs = require('./../index')(temp_movies, configuration);

    let result = itemsjs.search({
      ids: temp_movies.map(v => v.id).slice(0, 1)
    });

    assert.equal(result.data.items[0].id, 10);
    assert.equal(result.data.items[0]._id, 1);
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      ids: [50, 20]
    });

    assert.equal(result.data.items[0].id, 50);
    assert.equal(result.data.items[0]._id, 5);
    assert.equal(result.data.items.length, 2);
    done();
  });

  it('makes faceted search after separated quasi fulltext with custom id field', function test(done) {

    let i = 10;
    const temp_movies = movies.map(v => {

      v.uuid = i;
      i += 10;
      delete v.id;
      return v;
    });

    configuration.custom_id_field = 'uuid';

    itemsjs = require('./../index')(temp_movies, configuration);

    let result = itemsjs.search({
      ids: temp_movies.map(v => v.uuid).slice(0, 1),
    });

    assert.equal(result.data.items[0].uuid, 10);
    assert.equal(result.data.items[0]._id, 1);
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      ids: [50, 20]
    });

    assert.equal(result.data.items[0].uuid, 50);
    assert.equal(result.data.items[0]._id, 5);
    assert.equal(result.data.items.length, 2);
    done();
  });
});

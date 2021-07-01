'use strict';

const assert = require('assert');

describe('itemjs general tests', function() {

  const items = [{
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
  }];

  const similarItems = [{
    name: 'movie1',
    tags: 'Another tag'
  }, {
    name: 'movie2',
    tags: 'Another'
  }, {
    name: 'movie3',
    tags: 'Another tag'
  }];

  const itemsjs = require('./../index')(items);

  it('makes search', function test(done) {
    const result = itemsjs.search();
    assert.equal(result.data.items.length, 3);
    done();
  });

  it('makes search with pagination', function test(done) {

    let result = itemsjs.search({
      per_page: 1
    });
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      per_page: 1,
      page: 4
    });
    assert.equal(result.data.items.length, 0);

    result = itemsjs.search({
      per_page: 1,
      page: 3
    });
    assert.equal(result.data.items.length, 1);

    done();
  });

  it('makes search with pagination and filter', function test(done) {
    const result = itemsjs.search({
      per_page: 1,
      page: 3,
      filter: (item) => item.tags.includes('a')
    });

    assert.equal(result.data.items.length, 1);
    
    done();
  });

  it('makes search with aggregation filters', function test(done) {

    const itemsjs = require('./../index')(items, {
      aggregations: {
        tags: {},
        actors: {}
      }
    });

    let result = itemsjs.search({
      filters: {
        tags: ['e', 'f']
      }
    });
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      filters: {
        tags: ['e', 'f'],
        actors: ['a', 'b']
      }
    });
    assert.equal(result.data.items.length, 1);

    /*var result = itemsjs.search({
      filters: {
        tags: ['e', 'f'],
        actors: ['a', 'd']
      }
    });
    assert.equal(result.data.items.length, 0);

    var result = itemsjs.search();
    assert.equal(result.data.items.length, 3);*/

    done();
  });

  it('makes search with aggregation filters with single value object', function test(done) {

    const itemsjs = require('./../index')(similarItems, {
      aggregations: {
        tags: {}
      },
    });

    const result = itemsjs.search();
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 2); // Another tag
    assert.equal(result.data.aggregations.tags.buckets[1].doc_count, 1); // Another

    /*var result = itemsjs.search({
      query: '',
      filters: {
        name: [],
        tags: ['Another tag']
      },
      per_page: Infinity
    });
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, result.data.items.length);
    assert.equal(result.data.items.length, 2);

    var result = itemsjs.search({
      filters: {
        tags: ['Another']
      }
    });
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, result.data.items.length);
    assert.equal(result.data.items.length, 1);*/

    done();
  });

  it('makes aggregations when configuration supplied', function test(done) {
    const itemsjs = require('./../index')(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    const result = itemsjs.search({});

    assert.equal(result.data.items.length, 3);
    //assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 6);
    done();
  });

  it('makes aggregations for non array (string) fields', function test(done) {
    const items = [{
      name: 'movie1',
      tags: 'a',
    }, {
      name: 'movie2',
      tags: 'a',
    }, {
      name: 'movie3',
      tags: 'a',
    }];

    const itemsjs = require('./../index')(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    const result = itemsjs.search({});
    assert.equal(result.data.items.length, 3);
    //assert.equal(result.data.aggregations.tags.name, 'tags');
    assert.equal(result.data.aggregations.tags.buckets.length, 1);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 3);
    done();
  });

  xit('makes aggregations for undefined field', function test(done) {
    const items = [{
      name: 'movie1',
    }, {
      name: 'movie2',
    }, {
      name: 'movie3',
    }];

    const itemsjs = require('./../index')(items, {
      aggregations: {
        tags: {
          type: 'terms',
          size: 10,
          title: 'Tags'
        }
      }
    });
    const result = itemsjs.search({});
    assert.equal(result.data.items.length, 3);
    //assert.equal(result.data.aggregations.tags.buckets.length, {});
    done();
  });

  it('search by tags', function test(done) {

    const items = [{
      name: 'movie1',
      tags: ['drama']
    }, {
      name: 'movie2',
      tags: ['drama', 'crime']
    }, {
      name: 'movie3',
    }];

    const itemsjs = require('./../index')(items, {
      searchableFields: ['name', 'tags']
    });
    let result = itemsjs.search({
      query: 'drama'
    });
    assert.equal(result.data.items.length, 2);

    result = itemsjs.search({
      query: 'crime'
    });
    assert.equal(result.data.items.length, 1);

    done();
  });

});

'use strict';

const assert = require('assert');
const items = [{
  genres: 'Western'
}, {
  genres: 'Western'
}, {
  genres: 'Comedy'
}, {
  genres: 'Drama'
}, {
  genres: 'Horror'
}, {
  genres: 'Romance'
}, {
  genres: 'Western'
}];

describe('facet sorting', function() {

  it('sort by key', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: ['key'],
        }
      }
    }).aggregation({
      name: 'genres',
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Comedy', 'Drama', 'Horror', 'Romance', 'Western']);

    done();
  });

  it('sort by key descending', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: ['key'],
          order: ['desc']
        }
      }
    }).aggregation({
      name: 'genres',
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Western', 'Romance', 'Horror', 'Drama', 'Comedy']);

    done();
  });

  it('sort by doc_count', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: ['doc_count'],
          order: ['desc'],
        }
      }
    }).aggregation({
      name: 'genres',
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Western', 'Comedy', 'Drama', 'Horror', 'Romance']);

    done();
  });

  it('sort by doc_count and key and order key desc', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: ['doc_count', 'key'],
          order: ['desc', 'desc'],
        }
      }
    }).aggregation({
      name: 'genres',
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Western', 'Romance', 'Horror', 'Drama', 'Comedy']);

    done();
  });

});


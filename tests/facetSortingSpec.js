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

  it('sort by key (field, not array)', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: 'key',
          order: 'desc',
        }
      }
    }).aggregation({
      name: 'genres',
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Western', 'Romance', 'Horror', 'Drama', 'Comedy']);

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

  it('sort by count', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: 'count',
          order: 'desc',
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

  it('sort by selected, key and order by desc, asc if sort is term', function test(done) {
    const result_array = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: ['selected', 'key'],
          order: ['desc', 'asc']
        }
      }
    }).aggregation({
      name: 'genres'
    });

    const result_term = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: 'term'
        }
      }
    }).aggregation({
      name: 'genres'
    });

    assert.deepEqual(result_array.data.buckets, result_term.data.buckets);

    done();
  });

  it('sort by selected if chosen_filters_on_top is not set', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: 'term'
        }
      }
    }).aggregation({
      name: 'genres',
      filters: {
        genres: ['Drama', 'Romance']
      }
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Drama', 'Romance', 'Comedy', 'Horror', 'Western']);

    done();
  });

  it('does not sort by selected if chosen_filters_on_top is false', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          sort: 'key',
          chosen_filters_on_top: false
        }
      }
    }).aggregation({
      name: 'genres',
      filters: {
        genres: ['Drama', 'Romance']
      }
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Comedy', 'Drama', 'Horror', 'Romance', 'Western']);

    done();
  });

  it('excludes filters with zero doc_count if hide_zero_doc_count is true', function test(done) {

    const result = require('./../index')(items, {
      aggregations: {
        genres: {
          hide_zero_doc_count: true
        }
      }
    }).aggregation({
      name: 'genres',
      filters: {
        genres: ['Western']
      }
    });

    assert.deepEqual(result.data.buckets.map(v => v.key), ['Western']);

    done();
  });
});


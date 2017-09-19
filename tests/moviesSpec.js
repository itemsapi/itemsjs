'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var sinon = require('sinon')
var service = require('./../src/lib');

describe('itemjs tests with movies fixture', function() {

  var items = (require('./fixtures/movies.json'))

  describe('search', function() {

    it('makes search', function test(done) {

      var itemsjs = require('./../src/index')(items, {
        aggregations: {
          tags: {},
          genres: {}
        }
      });

      var result = itemsjs.search({
        per_page: 100
      });
      assert.equal(result.data.items.length, 20);


      //var spy = sinon.spy(service, 'aggregations');
      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['Biography']
        }
      });

      //assert.equal(spy.callCount, 1);
      //assert.equal(spy.firstCall.args[0].length, 20);
      assert.equal(result.data.items.length, 3);
      //spy.restore();


      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['Biography']
        }
      });

      console.log(result.data.items);

      assert.equal(result.data.items.length, 3);
      assert.equal(result.data.aggregations.genres.buckets.length, 6);

      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['Biography'],
          tags: ['wrestling']
        }
      });
      assert.equal(result.data.items.length, 1);
      assert.equal(result.data.aggregations.genres.buckets.length, 4);

      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['No genre']
        }
      });
      assert.equal(result.data.items.length, 0);
      assert.equal(result.data.aggregations.genres.buckets.length, 0);

      done();
    });

    it('makes search with disjunctive filters', function test(done) {

      var itemsjs = require('./../src/index')(items, {
        aggregations: {
          tags: {
            size: 500
          },
          genres: {
            conjunction: false,
            size: 200
          }
        }
      });

      var result = itemsjs.search({
        per_page: 100,
      });
      assert.equal(result.data.items.length, 20);
      assert.equal(result.data.aggregations.genres.buckets.length, 13);
      assert.equal(result.data.aggregations.tags.buckets.length, 92);

      var spy = sinon.spy(service, 'aggregations');

      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['Biography']
        }
      });

      assert.equal(spy.callCount, 1);
      assert.equal(spy.firstCall.args[0].length, 20);
      //console.log(spy.firstCall.args);
      //console.log(result.data.aggregations.genres.buckets);
      assert.equal(result.data.items.length, 3);
      assert.equal(result.data.aggregations.tags.buckets.length, 15);
      assert.equal(result.data.aggregations.genres.buckets.length, 13);
      spy.restore();


      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['Biography', 'Sport']
        }
      });

      assert.equal(result.data.items.length, 3);
      assert.equal(result.data.aggregations.tags.buckets.length, 15);
      assert.equal(result.data.aggregations.genres.buckets.length, 13);



      var result = itemsjs.search({
        per_page: 100,
        filters: {
          genres: ['Biography'], tags: ['wrestler']
        }
      });

      //assert.equal(spy.callCount, 1);
      //assert.equal(spy.firstCall.args[0].length, 20);
      //console.log(spy.firstCall.args);
      //console.log(result.data.aggregations.genres.buckets);
      assert.equal(result.data.items.length, 1);
      assert.equal(result.data.aggregations.genres.buckets.length, 4);
      spy.restore();

      done();
    })
  })

  it('makes search with not filters', function test(done) {

    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {
        },
        genres: {
        }
      }
    });

    var result = itemsjs.search({
      per_page: 100,
      filters: {
        genres: ['Biography']
      }
    });

    console.log(result.data.aggregations.genres.buckets);
    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.genres.buckets.length, 6);

    var result = itemsjs.search({
      per_page: 100,
      filters: {
        genres: ['Sport']
      }
    });

    console.log(result.data.aggregations.genres.buckets);
    assert.equal(result.data.items.length, 1);
    assert.equal(result.data.aggregations.genres.buckets.length, 4);


    var result = itemsjs.search({
      per_page: 100,
      filters: {
        genres: ['Biography']
      },
      not_filters: {
        genres: ['Sport']
      }
    });

    console.log(result.data.aggregations.genres.buckets);
    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.genres.buckets.length, 4);

    var result = itemsjs.search({
      per_page: 100,
      filters: {
        genres: ['Biography']
      },
      exclude_filters: {
        genres: ['Sport']
      }
    });

    console.log(result.data.aggregations.genres.buckets);
    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.genres.buckets.length, 4);
    done();

  })

  it('makes search with is_empty aggregation type', function test(done) {

    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {
        },
        empty_tags: {
          type: 'is_empty',
          field: 'tags'
        }
      }
    });

    var result = itemsjs.search({
      per_page: 20,
      filters: {
        //genres: ['Biography']
      }
    });

    //console.log(result.data.aggregations.genres.buckets);
    assert.equal(result.data.items.length, 20);
    assert.equal(result.data.aggregations.tags.buckets.length, 10);
    assert.equal(result.data.aggregations.empty_tags.buckets.length, 1);
    assert.equal(result.data.aggregations.empty_tags.buckets[0].doc_count, 20);
    assert.equal(result.data.aggregations.empty_tags.buckets[0].key, 'not_empty');
    console.log(result.data.aggregations.empty_tags.buckets);
    done();
  })


  describe('aggregation', function() {

    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {},
        genres: {}
      }
    });

    it('makes basic aggregation', function test(done) {

      var result = itemsjs.aggregation({
        name: 'tags',
        per_page: 12
      });

      //console.log(result.data.buckets);
      assert.equal(result.pagination.total, 92);
      assert.equal(result.pagination.per_page, 12);
      assert.equal(result.data.buckets.length, 12);

      var result = itemsjs.aggregation({
        name: 'genres',
        per_page: 12
      });

      assert.equal(result.pagination.total, 13);
      assert.equal(result.pagination.per_page, 12);
      assert.equal(result.data.buckets.length, 12);
      assert.equal(result.data.buckets[0].key, 'Drama');
      assert.equal(result.data.buckets[0].doc_count, 15);

      var result = itemsjs.aggregation({
        name: 'genres',
        per_page: 12,
        page: 2
      });

      assert.equal(result.pagination.total, 13);
      assert.equal(result.pagination.per_page, 12);
      assert.equal(result.pagination.page, 2);
      assert.equal(result.data.buckets.length, 1);

      done()
    })

    it('makes basic aggregation with query', function test(done) {

      var result = itemsjs.aggregation({
        name: 'genres',
        query: 'Drama',
        per_page: 12
      });

      assert.equal(result.pagination.total, 1);
      assert.equal(result.data.buckets.length, 1);
      assert.equal(result.data.buckets[0].key, 'Drama');
      assert.equal(result.data.buckets[0].doc_count, 15);

      var result = itemsjs.aggregation({
        name: 'genres',
        query: 'drama',
        per_page: 12
      });

      assert.equal(result.pagination.total, 1);
      assert.equal(result.data.buckets.length, 1);
      assert.equal(result.data.buckets[0].key, 'Drama');
      assert.equal(result.data.buckets[0].doc_count, 15);

      var result = itemsjs.aggregation({
        name: 'genres',
        query: 'dra',
        per_page: 12
      });

      assert.equal(result.pagination.total, 1);
      assert.equal(result.data.buckets.length, 1);
      assert.equal(result.data.buckets[0].key, 'Drama');
      assert.equal(result.data.buckets[0].doc_count, 15);
      done()
    })
  })
});

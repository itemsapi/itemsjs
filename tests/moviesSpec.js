'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var sinon = require('sinon')
var service = require('./../src/lib');

describe('itemjs tests with movies fixture', function() {

  var items = (require('./fixtures/movies.json'))

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

    //var result = itemsjs.search({
      //per_page: 100,
      //filters: {
        //genres: ['Biography']
      //}
    //});

    //assert.equal(spy.callCount, 1);
    //assert.equal(spy.firstCall.args[0].length, 20);
    ////console.log(spy.firstCall.args);
    //spy.restore();


    var result = itemsjs.search({
      per_page: 100,
      filters: {
        genres: ['Biography']
      }
    });
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
});

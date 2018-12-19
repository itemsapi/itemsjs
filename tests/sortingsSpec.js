'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');
var sinon = require('sinon')
var _ = require('lodash');

describe('aggregations', function() {

  var items = [{
    name: 'movie1',
    date: '2018-12-03',
  }, {
    name: 'movie7',
    date: '2018-12-01',
  }, {
    name: 'movie3',
    date: '2018-12-02',
  }, {
    name: 'movie2',
    date: '2018-12-01',
  }]

  it('makes items sorting', function test(done) {

    var sortings = {
      name_asc: {
        field: 'name',
        order: 'asc'
      },
      name_desc: {
        field: 'name',
        order: 'desc'
      },
      date_asc: {
        field: ['date', 'name'],
        order: ['asc', 'asc']
      }
    }

    var result = service.sorted_items(items, 'name_asc', sortings);
    assert.deepEqual(_.map(result, 'name'), ['movie1', 'movie2', 'movie3', 'movie7']);

    var result = service.sorted_items(items, 'name_desc', sortings);
    assert.deepEqual(_.map(result, 'name'), ['movie1', 'movie2', 'movie3', 'movie7'].reverse());

    var result = service.sorted_items(items, 'date_asc', sortings);
    assert.deepEqual(_.map(result, 'name'), ['movie2', 'movie7', 'movie3', 'movie1']);

    var customSort = {
      field: ['date', 'name'],
      order: ['desc', 'desc']
    }
    var result = service.sorted_items(items, customSort);
    assert.deepEqual(_.map(result, 'name'), ['movie1', 'movie3', 'movie7', 'movie2']);
    done();
  });
});

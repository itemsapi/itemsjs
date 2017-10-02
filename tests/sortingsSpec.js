'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');
var sinon = require('sinon')
var _map = require('lodash/map');

describe('aggregations', function() {

  var items = [{
    name: 'movie1',
  }, {
    name: 'movie7',
  }, {
    name: 'movie3',
  }, {
    name: 'movie2',
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
      }
    }

    var result = service.sorted_items(items, 'name_asc', sortings);
    assert.deepEqual(_map(result, 'name'), ['movie1', 'movie2', 'movie3', 'movie7']);

    var result = service.sorted_items(items, 'name_desc', sortings);
    assert.deepEqual(_map(result, 'name'), ['movie1', 'movie2', 'movie3', 'movie7'].reverse());
    done();
  });
});

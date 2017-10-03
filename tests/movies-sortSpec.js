'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var sinon = require('sinon')
var service = require('./../src/lib');
var _flow = require('lodash/flow');
var _map = require('lodash/map');
var _slice = require('lodash/slice');

describe('itemjs tests with movies fixture', function() {

  var items = (require('./fixtures/movies.json'))


  //var sorted_items = _.sortBy(items, [function(o) { return !o.name; }]);
  //var sorted_items = _.sortBy(items, [function(o) { return o.name; }]);
  //var sorted_items = _.sortBy(items, [function(o) { return !o['year']; }]);
  //var sorted_items = _.sortBy(items, [function(o) { return !o.year; }]);
  //var sorted_items = _.orderBy(items, ['year'], ['asc']);

  //console.log(_.chain(sorted_items).map('year').slice(0, 5).value());
  //console.log(_.chain(sorted_items).map('name').slice(0, 5).value());


  it('makes search', function test(done) {

    var itemsjs = require('./../src/index')(items, {
      aggregations: {
        tags: {},
        genres: {}
      },
      sortings: {
        name_asc: {
          field: 'name',
          order: 'asc'
        },
        name_desc: {
          field: 'name',
          order: 'desc'
        },
        year_asc: {
          field: 'year',
          order: 'asc'
        }
      }
    });

    var result = itemsjs.search({
      sort: 'name_asc',
      per_page: 3
    });

    assert.equal(result.data.items.length, 3);
    assert.deepEqual(_flow([
      (items) => _map(items, 'name')
    ])(result.data.items), ['12 Angry Men', 'Dangal', 'Fight Club']);

    var result = itemsjs.search({
      sort: 'name_desc',
      per_page: 3
    });
    assert.deepEqual(_flow([
      (items) => _map(items, 'name'),
      (items) => _slice(items, 0, 1)
    ])(result.data.items), ['The Shawshank Redemption']);

    done();
  });

});

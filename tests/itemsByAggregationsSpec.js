'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');

describe('bucket', function() {

  var items = [{
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
  }]

  it('filters items by aggregations', function test(done) {
    var result = service.items_by_aggregations(items, {
      tags: {
        filters: ['a']
      },
      actors: {}
    })

    assert.equal(result.length, 3);
    done();
  });

  it('filters items by aggregations and not existent filters', function test(done) {
    var result = service.items_by_aggregations(items, {
      tags: {
        filters: ['z']
      },
      actors: {}
    })

    assert.equal(result.length, 0);
    done();
  });

  it('filters items by aggregations and disjunction', function test(done) {
    var result = service.items_by_aggregations(items, {
      tags: {
        filters: ['a', 'c'],
        conjunction: false
      },
      actors: {}
    })

    assert.equal(result.length, 3);
    done();
  });

  it('has filterable item', function test(done) {

    var item = {
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }

    assert.equal(service.filterable_item(item, {
      tags: {},
      actors: {}
    }), true);

    assert.equal(service.filterable_item(item, {
      tags: {
        filters: ['f']
      },
      actors: {}
    }), false);

    assert.equal(service.filterable_item(item, {
      tags: {
        filters: ['a']
      },
      actors: {}
    }), true);

    assert.equal(service.filterable_item(item, {
      tags: {
        filters: ['a', 'f']
      },
    }), false);

    assert.equal(service.filterable_item(item, {
      tags: {
        filters: ['a', 'f'],
        conjunction: false
      },
    }), true);

    assert.equal(service.filterable_item({
      tags: [ 'a', 'e', 'f' ]
    }, {
      tags: {
        filters: [ 'a', 'c' ],
        conjunction: false
      },
    }), true);

    assert.equal(service.filterable_item(item, {
      tags: {
        filters: ['g', 'f'],
        conjunction: false
      },
    }), false);

    assert.equal(service.filterable_item(item, {
      tags: {
        filters: ['a']
      },
      actors: {
        filters: ['a']
      }
    }), true);

    done();
  });

});

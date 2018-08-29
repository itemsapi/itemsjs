'use strict';

import should from 'should';
import expect from 'expect';
import assert from 'assert';
import * as service from './../src/lib';

describe('aggregations', function() {

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


  it('makes search', function test(done) {
    var result = service.search(items);
    assert.equal(result.data.items.length, 3);
    done();
  });

  it('makes search with pagination', function test(done) {
    var result = service.search(items, {
      per_page: 1
    });
    assert.equal(result.data.items.length, 1);

    var result = service.search(items, {
      per_page: 1,
      page: 4
    });
    assert.equal(result.data.items.length, 0);

    var result = service.search(items, {
      per_page: 1,
      page: 3
    });
    assert.equal(result.data.items.length, 1);
    done();
  });


  it('makes search with aggregations', function test(done) {

    var result = service.search(items, {
      aggregations: {
        tags: {
          filters: ['e', 'f'],
        }
      }
    });
    assert.equal(result.data.items.length, 1);
    done();

  });


});

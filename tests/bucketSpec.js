'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');

describe('bucket', function() {

  it('returns aggregated fields for one item', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }, {
      tags: {},
      actors: {}
    })

    assert.equal(result.tags.length, 4);
    assert.equal(result.actors.length, 2);

    done();
  });

  it('returns aggregated fields for one item', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }, {
      tags: {
        filters: ['c']
      },
      actors: {}
    })

    assert.equal(result.tags.length, 4);
    assert.equal(result.actors.length, 2);

    done();
  });

  it('returns aggregated fields for one item', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }, {
      tags: {
        filters: ['e']
      },
      actors: {}
    })

    assert.equal(result.tags.length, 0);
    assert.equal(result.actors.length, 0);

    done();
  });

  it('returns aggregated fields for one item', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }, {
      tags: {
        filters: ['a', 'e']
      },
      actors: {}
    })

    assert.equal(result.tags.length, 0);
    assert.equal(result.actors.length, 0);

    done();
  });

  it('returns aggregated fields for one item', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      genre: ['drama', 'comedy'],
      actors: ['a', 'b']
    }, {
      tags: {
        filters: ['a']
      },
      genre: {},
      actors: {}
    })

    assert.equal(result.tags.length, 4);
    assert.equal(result.genre.length, 2);
    assert.equal(result.actors.length, 2);

    done();
  });

  it('returns aggregated fields for one item with non array field', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      genre: 'drama',
      actors: ['a', 'b']
    }, {
      genre: {
        filters: ['drama']
      },
      tags: {},
      actors: {}
    });

    assert.equal(result.tags.length, 4);
    // string was converted to array
    assert.equal(result.genre.length, 1);
    assert.equal(result.actors.length, 2);

    done();
  });

  it('returns aggregated fields for one item with undefined field', function test(done) {
    var result = service.bucket({
      name: 'movie1',
      genre: ['drama'],
      actors: ['a', 'b']
    }, {
      genre: {},
      tags: {},
      actors: {}
    });

    assert.equal(result.tags.length, 0);
    // string was converted to array
    assert.equal(result.genre.length, 1);
    assert.equal(result.actors.length, 2);

    done();
  });

});

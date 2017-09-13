
'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/lib');
var helpers = require('./../src/helpers');
var sinon = require('sinon')

describe('bucket field', function() {

  it('returns aggregated fields for one item', function test(done) {

    var item = {
      name: 'movie1',
      tags: ['a', 'b', 'c', 'd'],
      actors: ['a', 'b']
    }

    var spy = sinon.spy(helpers, 'conjunctive_field');

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a'],
      },
      actors: {
        filters: []
      }
    }, 'tags')

    assert.equal(spy.callCount, 1);
    assert.deepEqual(spy.firstCall.args[0], ['a', 'b']);
    assert.deepEqual(spy.firstCall.args[1], []);
    assert.equal(true, spy.firstCall.returnValue);
    assert.deepEqual(result, ['a', 'b', 'c', 'd']);
    spy.restore();

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a', 'z'],
      },
      actors: {
        filters: []
      }
    }, 'tags')

    assert.deepEqual(result, []);



    var result = service.bucket_field(item, {
      tags: {
        filters: ['a', 'z'],
        conjunction: false
      },
      actors: {
        filters: [],
      }
    }, 'tags')

    assert.deepEqual(result, ['a', 'b', 'c', 'd']);

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a', 'e'],
      },
      actors: {
        filters: ['z']
      }
    }, 'tags')
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a', 'e'],
        conjunction: false
      },
      actors: {
        filters: ['z']
      }
    }, 'tags')
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a', 'e'],
        conjunction: false
      },
      actors: {
        filters: ['a', 'b']
      }
    }, 'tags')
    assert.deepEqual(result, ['a', 'b', 'c', 'd']);

    var aggregations = {
      tags: {
        filters: ['a', 'e'],
        conjunction: false
      },
      actors: {
        filters: []
      }
    }

    var result = service.bucket_field(item, aggregations, 'actors')
    assert.deepEqual(result, ['a', 'b']);

    var result = service.bucket(item, aggregations)
    assert.deepEqual(result.tags, ['a', 'b', 'c', 'd']);
    assert.deepEqual(result.actors, ['a', 'b']);






    var aggregations = {
      tags: {
        filters: ['a', 'e'],
        conjunction: false
      },
      actors: {
        filters: ['a', 'b', 'c']
      }
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result, []);
    var result = service.bucket(item, aggregations)
    assert.deepEqual(result.tags, []);
    assert.deepEqual(result.actors, []);

    done();
  })



  it('returns aggregated fields for one item (readable test)', function test(done) {

    var item = {
      tags: ['police', 'revenge', 'love', 'battle'],
      actors: ['Robert', 'Clint', 'Michael', 'Brad'],
      genres: ['Drama', 'Thriller', 'Comedy']
    }

    var aggregations = {
      tags: {
        filters: ['police'],
      },
      actors: {
        filters: ['John'],
        conjunction: false
      },
      genres: {
        filters: ['Drama', 'Animation'],
        conjunction: false
      }
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, aggregations, 'actors')
    assert.deepEqual(result, ['Robert', 'Clint', 'Michael', 'Brad']);

    var result = service.bucket_field(item, aggregations, 'genres')
    assert.deepEqual(result, []);

    done();
  })

  it('returns aggregated fields for one item with negative filter (readable test)', function test(done) {

    var item = {
      tags: ['police', 'revenge', 'love', 'battle'],
      actors: ['Robert', 'Clint', 'Michael', 'Brad'],
      genres: ['Drama', 'Thriller', 'Comedy']
    }

    var aggregations = {
      tags: {
      },
      actors: {
      },
      genres: {
        not_filters: ['Drama'],
      }
    }

    var spy2 = sinon.spy(helpers, 'is_not_filters_agg');
    var spy = sinon.spy(helpers, 'not_filters_field');
    var result = service.bucket_field(item, aggregations, 'tags')
    assert.equal(spy.callCount, 1);
    assert.equal(spy2.callCount, 3);
    assert.deepEqual(spy.firstCall.args[0], ['Drama', 'Thriller', 'Comedy']);
    assert.deepEqual(spy.firstCall.args[1], ['Drama']);
    assert.equal(false, spy.firstCall.returnValue);
    assert.deepEqual(result, []);
    spy.restore();
    spy2.restore();

    var result = service.bucket_field(item, aggregations, 'actors')
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, aggregations, 'genres')
    assert.deepEqual(result, []);

    done();
  })

  it('returns aggregated fields for one item with negative filter (readable test)', function test(done) {

    var item = {
      tags: ['police', 'revenge', 'love', 'battle'],
      actors: ['Robert', 'Clint', 'Michael', 'Brad'],
      genres: ['Drama', 'Thriller', 'Comedy']
    }

    var aggregations = {
      tags: {
      },
      actors: {
      },
      genres: {
        not_filters: ['Action'],
      }
    }

    var spy2 = sinon.spy(helpers, 'is_not_filters_agg');
    var spy = sinon.spy(helpers, 'not_filters_field');
    var result = service.bucket_field(item, aggregations, 'tags')
    assert.equal(spy.callCount, 1);
    assert.equal(spy2.callCount, 3);
    assert.deepEqual(spy.firstCall.args[0], ['Drama', 'Thriller', 'Comedy']);
    assert.deepEqual(spy.firstCall.args[1], ['Action']);
    assert.equal(true, spy.firstCall.returnValue);
    assert.deepEqual(result, ['police', 'revenge', 'love', 'battle']);
    spy.restore();
    spy2.restore();

    var result = service.bucket_field(item, aggregations, 'actors')
    assert.deepEqual(result.length, 4);

    var result = service.bucket_field(item, aggregations, 'genres')
    assert.deepEqual(result.length, 3);

    done();
  })

  it('returns aggregated fields for one item with negative filter (readable test)', function test(done) {

    var item = {
      tags: ['police', 'revenge', 'love', 'battle'],
      actors: ['Robert', 'Clint', 'Michael', 'Brad'],
      genres: ['Drama', 'Thriller', 'Comedy']
    }

    var aggregations = {
      tags: {
      },
      actors: {
        filters: ['Robert']
      },
      genres: {
        not_filters: ['Action'],
      }
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result.length, 4);

    var result = service.bucket_field(item, aggregations, 'actors')
    assert.deepEqual(result.length, 4);

    var result = service.bucket_field(item, aggregations, 'genres')
    assert.deepEqual(result.length, 3);

    done();
  })
})


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

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a'],
      },
      actors: {
        filters: []
      }
    }, 'tags')

    assert.deepEqual(result, ['a', 'b', 'c', 'd']);

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

    var result = service.bucket_field(item, {
      tags: {
        filters: ['a', 'e'],
        conjunction: false
      },
      actors: {
        filters: ['a', 'b', 'c']
      }
    }, 'tags')
    assert.deepEqual(result, ['a', 'b', 'c', 'd']);

    done();
  })

})

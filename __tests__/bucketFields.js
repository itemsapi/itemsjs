
'use strict';

import should from 'should';
import expect from 'expect';
import assert from 'assert';
import * as service from './../src/lib';
import * as helpers from './../src/helpers';
import sinon from 'sinon';

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

  it('returns aggregated fields for one item (readable test)', function test(done) {

    var item = {
      tags: ['police', 'revenge', 'love', 'battle'],
      actors: ['Robert', 'Clint', 'Michael', 'Brad'],
      genres: []
    }

    var aggregations = {
      tags: {
        filters: ['police'],
      },
      empty_tags: {
        field: 'tags',
        type: 'is_empty'
      },
      empty_genres: {
        field: 'genres',
        type: 'is_empty'
      },
      /*actors: {
        filters: ['John'],
        conjunction: false
      },
      genres: {
        filters: ['Drama', 'Animation'],
        conjunction: false
      }*/
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result, ['police', 'revenge', 'love', 'battle']);

    var result = service.bucket_field(item, aggregations, 'empty_tags')
    assert.deepEqual(result, ['not_empty']);

    var result = service.bucket_field(item, aggregations, 'empty_genres')
    assert.deepEqual(result, ['empty']);



    var aggregations = {
      tags: {
        filters: ['historical', 'police'],
        conjunction: false
      },
      empty_tags: {
        field: 'tags',
        type: 'is_empty'
      },
      empty_genres: {
        field: 'genres',
        type: 'is_empty'
      }
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result, ['police', 'revenge', 'love', 'battle']);



    var spy = sinon.spy(helpers, 'is_empty_agg');
    var result = service.bucket_field(item, aggregations, 'empty_tags')
    //assert.equal(spy.callCount, 1);
    spy.restore();
    assert.deepEqual(result, ['not_empty']);

    var result = service.bucket_field(item, aggregations, 'empty_genres')
    assert.deepEqual(result, ['empty']);

    var aggregations = {
      tags: {
        filters: ['historical'],
      },
      empty_tags: {
        field: 'tags',
        type: 'is_empty'
      },
      empty_genres: {
        field: 'genres',
        type: 'is_empty'
      }
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, aggregations, 'empty_tags')
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, aggregations, 'empty_genres')
    assert.deepEqual(result, []);


    var aggregations = {
      tags: {
        filters: ['police'],
      },
      empty_tags: {
        field: 'tags',
        filters: ['not_empty'],
        type: 'is_empty'
      },
      empty_genres: {
        field: 'genres',
        type: 'is_empty'
      }
    }



    var spy = sinon.spy(helpers, 'check_empty_field');

    var result = service.bucket_field(item, aggregations, 'tags')
    //assert.deepEqual(spy.firstCall.args[0], { field: 'tags', filters: [ 'not_empty' ], type: 'is_empty' });
    assert.deepEqual(spy.firstCall.args[1], ['not_empty']);
    spy.restore();
    assert.deepEqual(result, ['police', 'revenge', 'love', 'battle']);

    var result = service.bucket_field(item, aggregations, 'empty_tags')
    assert.deepEqual(result, ['not_empty']);

    var result = service.bucket_field(item, aggregations, 'empty_genres')
    assert.deepEqual(result, ['empty']);

    var aggregations = {
      tags: {
        filters: ['police'],
      },
      empty_tags: {
        field: 'tags',
        filters: ['empty'],
        type: 'is_empty'
      },
      empty_genres: {
        field: 'genres',
        type: 'is_empty'
      }
    }

    var result = service.bucket_field(item, aggregations, 'tags')
    assert.deepEqual(result, []);

    var spy = sinon.spy(helpers, 'check_empty_field');
    var result = service.bucket_field(item, aggregations, 'empty_tags')
    assert.equal(spy.callCount, 2);
    assert.deepEqual(spy.secondCall.args[0], ['police', 'revenge', 'love', 'battle']);
    assert.deepEqual(spy.secondCall.args[1], ['empty']);
    spy.restore();
    assert.deepEqual(result, []);

    var result = service.bucket_field(item, aggregations, 'empty_genres')
    assert.deepEqual(result, []);

    done();
  })
})

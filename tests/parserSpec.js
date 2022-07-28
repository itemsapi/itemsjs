'use strict';

const assert = require('assert');
const helpers = require('./../src/helpers');

describe('parsing filters to matrix', function() {

  it('makes conjunction', function test(done) {

    const result = helpers.input_to_facet_filters({
      filters: {
        tags: ['novel', '90s']
      }
    }, {
      tags: {
        conjunction: true
      }
    });

    assert.deepEqual([ [ 'tags', 'novel' ], [ 'tags', '90s' ] ], result);
    done();
  });

  it('makes disjunction', function test(done) {

    const result = helpers.input_to_facet_filters({
      filters: {
        tags: ['novel', '90s']
      }
    }, {
      tags: {
        conjunction: false
      }
    });

    //assert.deepEqual([ [ [ 'tags', 'novel' ] ], [ [ 'tags', '90s' ] ] ], result);
    assert.deepEqual([ [ [ 'tags', 'novel' ], [ 'tags', '90s' ] ] ], result);
    done();
  });

  it('makes conjuction and disjunction', function test(done) {

    const result = helpers.input_to_facet_filters({
      filters: {
        tags: ['novel'],
        category: ['Western']
      }
    }, {
      tags: {
        conjunction: false
      },
      category: {
        conjunction: true
      }
    });

    assert.deepEqual([ [ [ 'tags', 'novel' ] ], [ 'category', 'Western' ]], result);
    done();
  });

  it('makes disjunction for two different groups', function test(done) {

    const result = helpers.input_to_facet_filters({
      filters: {
        tags: ['novel'],
        category: ['Western']
      }
    }, {
      tags: {
        conjunction: false
      },
      category: {
        conjunction: false
      }
    });

    assert.deepEqual([ [ [ 'tags', 'novel' ] ], [[ 'category', 'Western' ]]], result);
    done();
  });

  it('makes negative filter', function test(done) {

    const result = helpers.input_to_facet_filters({
      not_filters: {
        tags: ['novel', '90s']
      }
    }, {
      tags: {
        conjunction: true
      }
    });

    assert.deepEqual([ [ 'tags', '-', 'novel' ], [ 'tags', '-', '90s' ] ], result);
    done();
  });

  it('makes conjuction and disjunction and negative filter', function test(done) {

    const result = helpers.input_to_facet_filters({
      filters: {
        tags: ['novel'],
        category: ['Western']
      },
      not_filters: {
        tags: ['80s']
      }
    }, {
      tags: {
        conjunction: false
      },
      category: {
        conjunction: true
      }
    });

    assert.deepEqual([ [ [ 'tags', 'novel' ] ], [ 'category', 'Western' ], [ 'tags', '-', '80s' ]], result);
    done();
  });
});

describe('parsing boolean queries', function() {

  it('normalize query - accepts small letters operator etc remove white spaces', function test(done) {

    done();
  });

  it('makes conjunction', function test(done) {

    const result = helpers.parse_boolean_query('(tags:novel AND tags:90s)');
    assert.deepEqual([ [ ['tags', 'novel' ], [ 'tags', '90s' ] ] ], result);
    done();
  });

  it('makes disjunction', function test(done) {

    const result = helpers.parse_boolean_query('(tags:novel OR tags:90s)');
    assert.deepEqual([ [ [ 'tags', 'novel' ] ], [ [ 'tags', '90s' ] ] ], result);
    done();
  });

  it('makes conjunction and disjunction', function test(done) {

    const result = helpers.parse_boolean_query('tags:novel OR category:Western');
    assert.deepEqual([ [ [ 'tags', 'novel' ] ], [ [ 'category', 'Western' ] ] ], result);
    done();
  });
});

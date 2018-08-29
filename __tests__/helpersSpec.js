'use strict';

import assert from 'assert';
import * as helpers from './../src/helpers';

describe('helpers', function() {

  it('check includes', function test(done) {
    assert.equal(helpers.includes(['a', 'b', 'c'], 'a'), true);
    assert.equal(helpers.includes(['a', 'b', 'c']), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], 'e'), false);
    assert.equal(helpers.includes(['a', 'b', 'c'], []), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], ['a']), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], ['a', 'b']), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], ['a', 'b', 'e']), false);

    assert.equal(helpers.includes_any(['a', 'b', 'c'], ['a', 'b', 'e']), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], 'a'), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c']), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], []), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], ['f']), false);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], 'f'), false);
    assert.equal(helpers.includes_any([ 'a', 'b', 'c', 'd' ], [ 'a', 'f' ]), true);

    assert.equal(helpers.includes_any_element(['a', 'b', 'c'], ['a', 'b', 'e']), true);
    assert.equal(helpers.includes_any_element(['a', 'b', 'c'], 'a'), true);
    assert.equal(helpers.includes_any_element(['a', 'b', 'c']), false);
    assert.equal(helpers.includes_any_element(['a', 'b', 'c'], []), false);
    assert.equal(helpers.includes_any_element(['a', 'b', 'c'], ['f']), false);
    assert.equal(helpers.includes_any_element(['a', 'b', 'c'], 'f'), false);
    assert.equal(helpers.includes_any_element([ 'a', 'b', 'c', 'd' ], [ 'a', 'f' ]), true);

    done();
  });

  it('checks intersection', function test(done) {
    assert.deepEqual(helpers.intersection(['a', 'b', 'c'], ['a']), ['a']);
    assert.deepEqual(helpers.intersection(['a', 'b', 'c'], ['a', 'f']), ['a']);
    assert.deepEqual(helpers.intersection(['a', 'b', 'c'], 'a'), ['a']);
    assert.deepEqual(helpers.intersection(['a', 'b', 'c']), ['a', 'b', 'c']);
    done();
  });

  it('merge configuration with user input', function test(done) {

    var aggregations = {
      tags: {
        size: 15
      },
      tags2: {
        field: 'tags',
        size: 15
      }
    }

    var user_input = {
      filters: {
        tags: ['Tag1', 'Tag2'],
        actors: ['Actor1']
      },
      not_filters: {
        tags: ['Tag3'],
      }
    }

    var result = helpers.mergeAggregations(aggregations, user_input)

    assert.equal(result.tags.size, 15);
    assert.equal(result.tags.field, 'tags');
    assert.equal(result.tags2.field, 'tags');
    assert.deepEqual(result.tags.filters, ['Tag1', 'Tag2']);
    assert.deepEqual(result.tags.not_filters, ['Tag3']);

    assert.equal(aggregations.tags.size, 15);
    assert.equal(aggregations.tags.field, undefined);
    assert.equal(aggregations.tags2.field, 'tags');
    assert.equal(aggregations.tags.filters, undefined);
    assert.equal(aggregations.tags.not_filters, undefined);

    done();
  });

  it('check includes is_empty', function test(done) {
    assert.deepEqual(helpers.check_empty_field(['a', 'b', 'c']), ['not_empty']);
    assert.deepEqual(helpers.check_empty_field([]), ['empty']);
    assert.deepEqual(helpers.check_empty_field(), ['empty']);
    assert.deepEqual(helpers.check_empty_field(['a'], ['not_empty']), ['not_empty']);
    assert.deepEqual(helpers.check_empty_field([], ['not_empty']), false);
    assert.deepEqual(helpers.check_empty_field(['a'], ['empty']), false);
    assert.deepEqual(helpers.check_empty_field(''), ['empty']);

    done();
  });
});

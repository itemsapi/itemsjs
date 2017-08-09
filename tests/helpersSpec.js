'use strict';

var assert = require('assert');
var helpers = require('./../src/helpers');

describe('helpers', function() {

  it('check includes', function test(done) {
    assert.equal(helpers.includes(['a', 'b', 'c'], 'a'), true);
    assert.equal(helpers.includes(['a', 'b', 'c']), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], 'e'), false);
    assert.equal(helpers.includes(['a', 'b', 'c'], ['a']), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], ['a', 'b']), true);
    assert.equal(helpers.includes(['a', 'b', 'c'], ['a', 'b', 'e']), false);

    assert.equal(helpers.includes_any(['a', 'b', 'c'], ['a', 'b', 'e']), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], 'a'), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c']), true);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], ['f']), false);
    assert.equal(helpers.includes_any(['a', 'b', 'c'], 'f'), false);
    assert.equal(helpers.includes_any([ 'a', 'b', 'c', 'd' ], [ 'a', 'f' ]), true);

    done();
  });

  it('checks intersection', function test(done) {
    assert.deepEqual(helpers.intersection(['a', 'b', 'c'], ['a']), ['a']);
    assert.deepEqual(helpers.intersection(['a', 'b', 'c'], ['a', 'f']), ['a']);
    assert.deepEqual(helpers.intersection(['a', 'b', 'c'], 'a'), ['a']);
    assert.deepEqual(helpers.intersection(['a', 'b', 'c']), ['a', 'b', 'c']);
    done();
  });

});

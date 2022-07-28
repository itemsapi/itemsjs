'use strict';

const assert = require('assert');
const Facets = require('./../src/facets');
const helpers = require('./../src/helpers');
const FastBitSet = require('fastbitset');

describe('filtering matrix (9 rows in dataset)', function() {

  const items =  [
    {a: 1, b: 2, c: 3, d: 3},
    {a: 1, b: 3, c: 3, d: 3},
    {a: 2, b: 3, c: 3, d: 3},
    {a: 1, b: 2, c: 3, d: 3},
    {a: 2, b: 3, c: 3, d: 3},
    {a: 1, b: 2, c: 3, d: 3},
    {a: 1, b: 3, c: 3, d: 3},
    {a: 2, b: 3, c: 3, d: 3},
    {a: 2, b: 2, c: 3, d: 3}
  ];

  const fields = ['a', 'b', 'c'];

  it('checks matrix with no argument provided', function test(done) {

    const data = helpers.index(items, fields);

    const result = helpers.filters_matrix(data);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1, 2, 4, 6, 7]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [1, 4, 6, 9]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [2, 3, 5, 7, 8]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const ids = helpers.filters_ids(result.bits_data_temp);
    assert.deepEqual(ids.array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    done();
  });

  it('filters matrix with one value', function test(done) {

    const data = helpers.index(items, fields);
    const filters = helpers.parse_boolean_query('(a:2)');

    const result = helpers.filters_matrix(data, filters);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [9]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [3, 5, 8]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [3, 5, 8, 9]);

    const ids = helpers.filters_ids(result.bits_data_temp);
    assert.deepEqual(ids.array(), [3, 5, 8, 9]);

    done();
  });

  it('makes OR which returns all rows', function test(done) {

    const data = helpers.index(items, fields);
    const filters = helpers.parse_boolean_query('(a:2) OR c:3');

    const result = helpers.filters_matrix(data, filters);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1, 2, 4, 6, 7]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [1, 4, 6, 9]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [2, 3, 5, 7, 8]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    const ids = helpers.filters_ids(result.bits_data_temp);
    assert.deepEqual(ids.array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

    done();
  });

  it('makes AND which returns no result', function test(done) {

    const data = helpers.index(items, fields);
    const filters = helpers.parse_boolean_query('a:2 AND a:1');

    const result = helpers.filters_matrix(data, filters);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), []);

    const ids = helpers.filters_ids(result.bits_data_temp);
    assert.deepEqual(ids.array(), []);

    done();
  });

  it('makes AND with not existing value', function test(done) {

    const data = helpers.index(items, fields);
    const filters = helpers.parse_boolean_query('a:2 AND a:10');

    const result = helpers.filters_matrix(data, filters);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), []);
    done();
  });

  it('filters not existing value', function test(done) {

    const data = helpers.index(items, fields);
    const filters = helpers.parse_boolean_query('a:10');

    const result = helpers.filters_matrix(data, filters);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), []);
    done();
  });

  it('filters not existing key', function test(done) {

    const data = helpers.index(items, fields);
    const filters = helpers.parse_boolean_query('e:10');

    try {
      helpers.filters_matrix(data, filters);
    } catch (err) {
      assert.equal(err.message, 'Panic. The key does not exist in facets lists.');
    }
    done();
  });

});

'use strict';

const assert = require('assert');
const Facets = require('./../src/facets');
const helpers = require('./../src/helpers');
const FastBitSet = require('fastbitset');

describe('filtering and generating facets', function() {

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

  const aggregations = {
    a: {},
    b: {},
    c: {}
  };

  it('checks matrix without filters applied', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1, 2, 4, 6, 7]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [1, 4, 6, 9]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [2, 3, 5, 7, 8]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    done();
  });

  it('checks matrix with filters', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data, [['a', 2]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [9]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [3, 5, 8]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [3, 5, 8, 9]);
    done();
  });

  it('checks matrix with one empty filter', function test(done) {

    const data = helpers.index(items, aggregations);

    const result = helpers.matrix(data, [['a', 2], ['c', 2]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), []);
    done();
  });

  it('checks matrix with one empty filter and check again', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data, [['a', 2], ['c', 2]]);

    const result2 = helpers.matrix(data);
    assert.deepEqual(result2.bits_data_temp.a['1'].array(), [1, 2, 4, 6, 7]);
    assert.deepEqual(result2.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result2.bits_data_temp.b['2'].array(), [1, 4, 6, 9]);
    assert.deepEqual(result2.bits_data_temp.b['3'].array(), [2, 3, 5, 7, 8]);
    assert.deepEqual(result2.bits_data_temp.c['3'].array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    done();
  });


  it('checks matrix with disjunctive filters', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data, [[['a', 1], ['a', 2]]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1, 2, 4, 6, 7]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [3, 5, 8, 9]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [1, 4, 6, 9]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [2, 3, 5, 7, 8]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
    done();
  });

  it('checks matrix with disjunctive filters2', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data, [[['a', 1]], [['b', 2]], [['c', 3]]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1, 4, 6]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [1, 4, 6]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1, 4, 6]);
    done();
  });
});

describe('filtering and generating facets', function() {

  const items =  [
    {a: 1, b: 1, c: 3},
    {a: 2, b: 2, c: 3},
    {a: 3, b: 3, c: 3},
  ];

  const aggregations = {
    a: {},
    b: {},
    c: {}
  };

  it('checks matrix with disjunctive filters', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data, [[['a', 1], ['a', 2]]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [2]);
    assert.deepEqual(result.bits_data_temp.a['3'].array(), [3]);
    assert.deepEqual(result.bits_data_temp.b['1'].array(), [1]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [2]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1, 2]);
    done();
  });

  it('checks matrix with one disjunctive filters', function test(done) {

    const data = helpers.index(items, aggregations)

    const result = helpers.matrix(data, [[['a', 1]]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [2]);
    assert.deepEqual(result.bits_data_temp.a['3'].array(), [3]);
    assert.deepEqual(result.bits_data_temp.b['1'].array(), [1]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1]);
    done();
  });

  it('checks matrix with many disjunctive filters', function test(done) {

    const data = helpers.index(items, aggregations)
    const result = helpers.matrix(data, [[['a', 1]], [['b', 1]], [['c', 3]]]);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), [1]);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['1'].array(), [1]);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), []);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [1]);
    done();
  });

  it('checks matrix with negative filters', function test(done) {

    const data = helpers.index(items, aggregations);
    const result = helpers.matrix(data, [['a', '-', 1]]);
    //console.log(result.data);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), [2]);
    assert.deepEqual(result.bits_data_temp.a['3'].array(), [3]);
    assert.deepEqual(result.bits_data_temp.b['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), [2]);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [3]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [2, 3]);
    done();
  });

  it('checks matrix with negative filters 2', function test(done) {

    const data = helpers.index(items, aggregations);
    const result = helpers.matrix(data, [['a', '-', 1], ['b', '-', 2]]);
    //console.log(result.data);
    assert.deepEqual(result.bits_data_temp.a['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.a['3'].array(), [3]);
    assert.deepEqual(result.bits_data_temp.b['1'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['2'].array(), []);
    assert.deepEqual(result.bits_data_temp.b['3'].array(), [3]);
    assert.deepEqual(result.bits_data_temp.c['3'].array(), [3]);
    done();
  });
});

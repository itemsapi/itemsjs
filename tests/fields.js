
'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var service = require('./../src/helpers');
var helpers = require('./../src/helpers');
var sinon = require('sinon')

describe('bucket field', function() {

  it('checks conjunctive_field', function test(done) {

    var result = assert.equal(
      service.conjunctive_field(['a', 'b', 'c', 'd'], ['a']),
      true
    )

    var result = assert.equal(
      service.conjunctive_field(['a', 'b', 'c', 'd'], ['a', 'b']),
      true
    )

    var result = assert.equal(
      service.conjunctive_field(['a', 'b', 'c', 'd'], ['a', 'z']),
      false
    )

    done();
  })

  it('checks disjunctive_field', function test(done) {

    var result = assert.equal(
      service.disjunctive_field(['a', 'b', 'c', 'd'], ['a', 'z']),
      true
    )

    var result = assert.equal(
      service.disjunctive_field(['a', 'b', 'c', 'd'], ['z']),
      false
    )

    done();
  })

  it('checks not_filters field', function test(done) {

    var result = assert.equal(
      service.not_filters_field(['a', 'b', 'c', 'd'], ['z']),
      true
    )

    var result = assert.equal(
      service.not_filters_field(['a', 'b', 'c', 'd'], ['z']),
      true
    )

    var result = assert.equal(
      service.not_filters_field(['a', 'b', 'c', 'd'], ['a', 'z']),
      false
    )

    done();
  })

  it('checks exists field', function test(done) {

    var result = assert.equal(
      service.empty_field(['a', 'b', 'c', 'd']),
      false
    )

    var result = assert.equal(service.empty_field([]), true)

    done();
  })

  it('checks aggregation type', function test(done) {

    var result = assert.equal(
      service.is_conjunctive_agg({}),
      true
    )

    var result = assert.equal(
      service.is_disjunctive_agg({}),
      false
    )

    var result = assert.equal(
      service.is_not_filters_agg({}),
      false
    )

    var result = assert.equal(
      service.is_not_filters_agg({
        not_filters: ['Aha']
      }),
      true
    )

    var result = assert.equal(
      service.is_not_filters_agg({
        not_filters: []
      }),
      false
    )

    done();
  })
})

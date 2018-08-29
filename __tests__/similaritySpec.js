'use strict';

var should = require('should');
var expect = require('expect');
var assert = require('assert');
var _ = require('lodash');
var sinon = require('sinon')
var service = require('./../src/lib');

describe('itemjs tests with movies fixture', function() {

  var items = (require('./fixtures/movies.json'))

  describe('search', function() {

    it('makes simple similarity', function test(done) {

      var itemsjs = require('./../src/index')(items);

      // god father
      var result = itemsjs.similar(2, {
        field: 'tags',
        minimum: 1
      });

      assert.equal(result.data.items.length, 2);
      assert.equal(_.intersection(result.data.items[0].tags, items[1].tags).length, 2);
      assert.equal(_.intersection(result.data.items[1].tags, items[1].tags).length, 1);

      var result = itemsjs.similar(2, {
        field: 'tags',
      });

      assert.equal(result.data.items.length, 10);

      var result = itemsjs.similar(2, {
        field: 'tags',
        per_page: 10,
        page: 2
      });

      assert.equal(result.data.items.length, 9);
      done();
    });
  })
});

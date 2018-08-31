'use strict';

import should from 'should';
import expect from 'expect';
import assert from 'assert';
import _ from 'lodash';
import sinon from 'sinon';
import * as service from './../src/lib';
import ItemsJS from '../src';

describe('itemjs tests with movies fixture', function() {

  var items = (require('./fixtures/movies.json'))

  describe('search', function() {

    it('makes simple similarity', function test(done) {

      var itemsjs = ItemsJS(items);

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

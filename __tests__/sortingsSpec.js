'use strict';

import should from 'should';
import expect from 'expect';
import assert from 'assert';
import * as service from './../src/lib';
import sinon from 'sinon';
import _ from 'lodash';

describe('aggregations', function() {

  var items = [{
    name: 'movie1',
  }, {
    name: 'movie7',
  }, {
    name: 'movie3',
  }, {
    name: 'movie2',
  }]

  it('makes items sorting', function test(done) {

    var sortings = {
      name_asc: {
        field: 'name',
        order: 'asc'
      },
      name_desc: {
        field: 'name',
        order: 'desc'
      }
    }

    var result = service.sorted_items(items, 'name_asc', sortings);
    assert.deepEqual(_.map(result, 'name'), ['movie1', 'movie2', 'movie3', 'movie7']);

    var result = service.sorted_items(items, 'name_desc', sortings);
    assert.deepEqual(_.map(result, 'name'), ['movie1', 'movie2', 'movie3', 'movie7'].reverse());
    done();
  });
});

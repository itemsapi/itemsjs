'use strict';

var assert = require('assert');
var Fulltext = require('./../src/fulltext');
var _ = require('lodash');

describe('fulltext', function() {

  var items = _.map([
    'Godfather',
    'Fight club',
    'Forrest Gump'
  ], (val) => {
    return {
      name: val
    }
  });

  it('check includes', function test(done) {

    var fulltext = new Fulltext(items);
    console.log();
    assert.equal(fulltext.search('club').length, 1);
    assert.equal(fulltext.search('gump').length, 1);
    assert.equal(fulltext.search('gump')[0].name, 'Forrest Gump');
    assert.equal(fulltext.search('gump')[0].id, undefined);
    assert.equal(fulltext.search('titanic').length, 0);
    assert.equal(fulltext.search().length, 3);
    console.log(fulltext.search('gump'));

    done();
  });

});

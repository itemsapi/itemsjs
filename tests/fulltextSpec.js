'use strict';

var assert = require('assert');
var Fulltext = require('./../src/fulltext');

describe('fulltext', function() {

  var items = [{
    name: 'Godfather',
    tags: ['mafia', 'crime'],
  }, {
    name: 'Fight club',
    tags: ['dark humor', 'anti establishment'],
  }, {
    name: 'Forrest Gump',
    tags: ['running', 'vietnam'],
  }];

  it('checks search', function test(done) {

    var fulltext = new Fulltext(items);
    assert.equal(fulltext.search('club').length, 1);
    assert.equal(fulltext.search('gump').length, 1);
    assert.equal(fulltext.search('forrest gump').length, 1);
    assert.equal(fulltext.search('forrest GUMP').length, 1);
    assert.equal(fulltext.search('gump')[0].name, 'Forrest Gump');
    assert.equal(fulltext.search('gump')[0].id, 3);
    assert.equal(fulltext.search('titanic').length, 0);
    assert.equal(fulltext.search().length, 3);

    done();
  });

  it('checks search on another fields', function test(done) {

    var fulltext = new Fulltext(items, {
      searchableFields: ['name', 'tags']
    });
    assert.equal(fulltext.search('vietnam').length, 1);
    assert.equal(fulltext.search('dark').length, 1);
    assert.equal(fulltext.search('anti').length, 1);

    done();
  });

});

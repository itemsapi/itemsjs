'use strict';

var assert = require('assert');
var Fulltext = require('./../src/fulltext');
var _ = require('lodash');

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

  var specialItems = [
    {"name": "elation"},
    {"name": "source"}
 ]

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


  it('makes search stepping through characters', function test(done) {
    var fulltext = new Fulltext(specialItems, {
      searchableFields: ['name'],
      isExactSearch: true
    });
    assert.equal(fulltext.search('e').length, 1);
    assert.equal(fulltext.search('el').length, 1);
    assert.equal(fulltext.search('ela').length, 1);
    assert.equal(fulltext.search('elat').length, 1);
    assert.equal(fulltext.search('elati').length, 1); // Does not appear when stemmer is present
    assert.equal(fulltext.search('elatio').length, 1);
    assert.equal(fulltext.search('elation').length, 1);
    assert.equal(fulltext.search('s').length, 1);
    assert.equal(fulltext.search('so').length, 1); // Filtered by stopWordFilter
    assert.equal(fulltext.search('sou').length, 1);
    assert.equal(fulltext.search('sour').length, 1);
    assert.equal(fulltext.search('sourc').length, 1);
    assert.equal(fulltext.search('source').length, 1);

    done();
  });
});

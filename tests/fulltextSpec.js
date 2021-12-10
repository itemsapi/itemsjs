'use strict';

const assert = require('assert');
const Fulltext = require('./../src/fulltext');

describe('fulltext', function() {

  const items = [{
    name: 'Godfather',
    tags: ['mafia', 'crime'],
  }, {
    name: 'Fight club',
    tags: ['dark humor', 'anti establishment'],
  }, {
    name: 'Forrest Gump',
    tags: ['running', 'vietnam'],
  }];

  const items_with_ids = [{
    id: 10,
    name: 'Godfather',
    tags: ['mafia', 'crime'],
  }, {
    id: 20,
    name: 'Fight club',
    tags: ['dark humor', 'anti establishment'],
  }, {
    id: 30,
    name: 'Forrest Gump',
    tags: ['running', 'vietnam'],
  }];

  const specialItems = [
    {'name': 'elation'},
    {'name': 'source'},
    {'name': 'headless'}
  ];

  it('checks search', function test(done) {

    const fulltext = new Fulltext(items);
    assert.equal(fulltext.search_full('club').length, 1);
    assert.equal(fulltext.search_full('gump').length, 1);
    assert.equal(fulltext.search_full('forrest gump').length, 1);
    assert.equal(fulltext.search_full('forrest GUMP').length, 1);
    assert.equal(fulltext.search_full('gump')[0].name, 'Forrest Gump');
    assert.equal(fulltext.search_full('gump')[0]._id, 3);
    assert.equal(fulltext.search_full('gump')[0].id, undefined);
    assert.equal(fulltext.search_full('titanic').length, 0);
    assert.equal(fulltext.search_full().length, 3);

    done();
  });

  it('checks search with defined id\'s', function test(done) {

    const fulltext = new Fulltext(items_with_ids);
    assert.equal(fulltext.search_full('club').length, 1);
    assert.equal(fulltext.search_full('gump').length, 1);
    assert.equal(fulltext.search_full('forrest gump').length, 1);
    assert.equal(fulltext.search_full('forrest GUMP').length, 1);
    assert.equal(fulltext.search_full('gump')[0].name, 'Forrest Gump');
    assert.equal(fulltext.search_full('gump')[0]._id, 3);
    assert.equal(fulltext.search_full('gump')[0].id, 30);
    assert.equal(fulltext.search_full('titanic').length, 0);
    assert.equal(fulltext.search_full().length, 3);

    done();
  });

  it('checks search on another fields', function test(done) {

    const fulltext = new Fulltext(items, {
      searchableFields: ['name', 'tags']
    });
    assert.equal(fulltext.search('vietnam').length, 1);
    assert.equal(fulltext.search('dark').length, 1);
    assert.equal(fulltext.search('anti').length, 1);

    done();
  });


  it('makes search stepping through characters', function test(done) {
    const fulltext = new Fulltext(specialItems, {
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

  it('makes search stepping through characters', function test(done) {
    const stopwordfilter = new Fulltext(specialItems, {
      searchableFields: ['name'],
    });

    const withoutstopwordfilter = new Fulltext(specialItems, {
      searchableFields: ['name'],
      removeStopWordFilter: true
    });
    
    assert.equal(stopwordfilter.search('h').length, 1);
    assert.equal(stopwordfilter.search('he').length, 0); // The stopwordfilter filters out "he"
    assert.equal(stopwordfilter.search('hea').length, 1);
    assert.equal(stopwordfilter.search('head').length, 1);

    assert.equal(withoutstopwordfilter.search('h').length, 1);
    assert.equal(withoutstopwordfilter.search('he').length, 1); 
    assert.equal(withoutstopwordfilter.search('hea').length, 1);
    assert.equal(withoutstopwordfilter.search('head').length, 1);

    done();
  });


  xit('returns internal ids', function test(done) {

    const fulltext = new Fulltext(items);
    assert.deepEqual(fulltext.internal_ids(), [1, 2, 3]);
    assert.deepEqual(fulltext.bits_ids().array(), [1, 2, 3]);
    assert.deepEqual(fulltext.get_item(1).name, 'Godfather');

    done();
  });
});

'use strict';

const assert = require('assert');
const Facets = require('./../src/facets');
const helpers = require('./../src/helpers');
const FastBitSet = require('fastbitset');

const items = [{
  id: 1,
  name: 'movie1',
  tags: ['a', 'b', 'c', 'd'],
  actors: ['john', 'alex'],
  category: 'drama'
}, {
  id: 2,
  name: 'movie2',
  tags: ['a', 'e', 'f'],
  actors: ['john', 'brad'],
  category: 'comedy'
}, {
  id: 3,
  name: 'movie3',
  tags: ['a', 'c'],
  actors: ['jeff'],
  category: 'comedy'
}, {
  id: 4,
  name: 'movie4',
  tags: ['c', 'a', 'z'],
  actors: ['jean'],
  category: 'drama'
}];

describe('indexing', function() {


});

describe('conjunctive search', function() {

  const aggregations = {
    tags: {
      //title: 'Tags',
      conjunction: true,
    },
    actors: {
      title: 'Stars',
      conjunction: true,
    },
    category: {
      title: 'Category',
      conjunction: true,
    }
  };

  const facets = new Facets(items, {
    aggregations: aggregations
  });
  const itemsjs = require('./../index')(items, {
    aggregations: aggregations
  });

  it('checks index', function test(done) {

    const result = facets.index();
    assert.deepEqual(result.data.tags.a, [1, 2, 3, 4]);
    assert.deepEqual(result.bits_data.tags.a.array(), [1, 2, 3, 4]);
    assert.deepEqual(result.data.tags.b, [1]);
    assert.deepEqual(result.bits_data.tags.b.array(), [1]);
    assert.deepEqual(result.data.tags.c, [1, 3, 4]);
    assert.deepEqual(result.data.tags.d, [1]);
    assert.deepEqual(result.data.tags.e, [2]);
    assert.deepEqual(result.data.tags.z, [4]);
    assert.deepEqual(result.data.actors.jean, [4]);
    assert.deepEqual(result.bits_data.actors.jean.array(), [4]);
    assert.deepEqual(result.data.actors.john, [1, 2]);
    assert.deepEqual(result.bits_data.actors.john.array(), [1, 2]);

    done();
  });

  it('returns facets for two fields (tags, actors)', function test(done) {

    const input = {
      filters: {
        tags: ['c']
      }
    };

    let result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 3, 4]);
    assert.deepEqual(result.data.tags.c, [1, 3, 4]);
    assert.deepEqual(result.data.tags.e, []);
    assert.deepEqual(result.data.actors.john, [1]);
    assert.deepEqual(result.data.category.comedy, [3]);

    const ids = helpers.facets_ids(result['bits_data_temp'], input.filters, aggregations);
    assert.deepEqual(ids.array(), [1, 3, 4]);

    const buckets = helpers.getBuckets(result, input, aggregations);
    //console.log(buckets.tags.buckets);
    assert.deepEqual(buckets.tags.buckets[0].doc_count, 3);
    assert.deepEqual(buckets.tags.buckets[0].key, 'c');
    assert.deepEqual(buckets.tags.title, 'Tags');
    assert.deepEqual(buckets.actors.title, 'Stars');
    assert.deepEqual(buckets.category.title, 'Category');



    result = itemsjs.search(input);

    assert.deepEqual(result.pagination.total, 3);
    // omit _id in search result
    //assert.deepEqual(result.data.items[0]._id, undefined);
    assert.deepEqual(result.data.aggregations.tags.buckets[0].doc_count, 3);
    assert.deepEqual(result.data.aggregations.tags.buckets[0].key, 'c');



    done();
  });




  it('checks if search is working on copy data', function test(done) {

    const input = {
      filters: {
        tags: ['e']
      }
    };

    const result = facets.search(input, {
      test: true
    });

    //assert.deepEqual(result.bits_data.tags.a.array(), []);
    assert.deepEqual(result.data.tags.a, [2]);
    assert.deepEqual(result.data.tags.e, [2]);
    //assert.deepEqual(result.bits_data.tags.e.array(), [2]);
    //assert.deepEqual(result.data.actors.john, [1]);

    done();

  });

  it('returns facets for empty input', function test(done) {

    let input = {
      filters: {
      }
    };

    let result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 2, 3, 4]);
    assert.deepEqual(result.data.tags.e, [2]);

    const ids = helpers.facets_ids(result['bits_data_temp'], input.filters, aggregations);
    assert.deepEqual(ids, null);

    result = itemsjs.search(input);
    assert.deepEqual(result.pagination.total, 4);
    // omit _id in search result
    //assert.deepEqual(result.data.items[0]._id, undefined);
    assert.deepEqual(result.data.aggregations.tags.buckets[0].doc_count, 4);
    assert.deepEqual(result.data.aggregations.tags.buckets[0].key, 'a');

    input = {
      filters: {
        tags: []
      }
    };

    result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 2, 3, 4]);
    assert.deepEqual(result.data.tags.e, [2]);

    done();
  });

  xit('returns facets for not existed filters (does not exist in index)', function test(done) {

    const input = {
      filters: {
        tags: ['kkk']
      }
    };

    const result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, []);
    assert.deepEqual(result.data.tags.e, []);

    done();
  });

  it('returns facets for cross filters', function test(done) {

    const input = {
      filters: {
        tags: ['a'],
        actors: ['john']
      }
    };

    const result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 2]);
    assert.deepEqual(result.data.tags.e, [2]);
    assert.deepEqual(result.data.actors.john, [1, 2]);
    assert.deepEqual(result.data.actors.jean, []);

    done();
  });
});

describe('disjunctive search', function() {

  const aggregations = {
    tags: {
      conjunction: false,
    },
    actors: {
      conjunction: false,
    },
    category: {
      conjunction: false,
    }
  };

  const facets = new Facets(items, {
    aggregations: aggregations
  });

  it('returns facets', function test(done) {

    const input = {
      filters: {
        tags: ['c']
      }
    };

    const result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 2, 3, 4]);
    assert.deepEqual(result.data.tags.c, [1, 3, 4]);
    assert.deepEqual(result.data.tags.e, [2]);
    assert.deepEqual(result.data.actors.john, [1]);

    done();
  });

  it('returns facets for two filters', function test(done) {

    const input = {
      filters: {
        tags: ['z', 'f']
      }
    };

    const result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 2, 3, 4]);
    assert.deepEqual(result.data.tags.c, [1, 3, 4]);
    assert.deepEqual(result.data.tags.f, [2]);
    assert.deepEqual(result.data.tags.z, [4]);

    assert.deepEqual(result.data.actors.brad, [2]);
    assert.deepEqual(result.data.actors.jean, [4]);
    assert.deepEqual(result.data.actors.brad, [2]);

    assert.deepEqual(result.data.category.comedy, [2]);
    assert.deepEqual(result.data.category.drama, [4]);

    done();
  });

});

describe('disjunctive and conjunctive search', function() {

  const aggregations = {
    tags: {
      conjunction: true,
    },
    actors: {
      conjunction: true,
    },
    category: {
      conjunction: false
    }
  };

  const facets = new Facets(items, {
    aggregations: aggregations
  });

  it('returns facets', function test(done) {

    const input = {
      filters: {
        tags: ['c']
      }
    };

    const result = facets.search(input, {
      test: true
    });


    assert.deepEqual(result.data.tags.a, [1, 3, 4]);
    assert.deepEqual(result.data.tags.e, []);
    assert.deepEqual(result.data.actors.john, [1]);
    assert.deepEqual(result.data.category.comedy, [3]);

    done();
  });

  it('returns facets for cross filters', function test(done) {

    const input = {
      filters: {
        tags: ['c'],
        category: ['drama']
      }
    };

    const result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 4]);
    assert.deepEqual(result.data.tags.c, [1, 4]);
    assert.deepEqual(result.data.tags.e, []);
    assert.deepEqual(result.data.actors.john, [1]);
    assert.deepEqual(result.data.actors.alex, [1]);
    assert.deepEqual(result.data.category.comedy, [3]);
    assert.deepEqual(result.data.category.drama, [1, 4]);

    const ids = helpers.facets_ids(result['bits_data_temp'], input.filters, aggregations);
    assert.deepEqual(ids.array(), [1, 4]);

    done();

  });
});

describe('generates facets crossed with query', function() {

  const aggregations = {
    tags: {
      conjunction: true,
    },
    actors: {
      conjunction: true,
    },
    category: {
      conjunction: false
    }
  };

  const facets = new Facets(items, {
    aggregations: aggregations
  });
  const itemsjs = require('./../index')(items, {
    aggregations: aggregations,
    searchableFields: ['actors'],
  });

  it('returns facets for searched ids', function test(done) {

    let input = {
      filters: {
        tags: ['c']
      }
    };

    let result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1, 3, 4]);
    assert.deepEqual(result.data.tags.e, []);
    assert.deepEqual(result.data.actors.john, [1]);
    assert.deepEqual(result.data.category.comedy, [3]);


    input = {
      filters: {
        tags: ['c']
      }
    };

    result = facets.search(input, {
      query_ids: new FastBitSet([1]),
      test: true
    });

    assert.deepEqual(result.data.tags.a, [1]);
    assert.deepEqual(result.data.tags.e, []);
    assert.deepEqual(result.data.actors.john, [1]);
    assert.deepEqual(result.data.category.comedy, []);

    done();
  });

  it('returns facets for searched ids', function test(done) {

    const input = {
      query: 'john'
    };

    const result = itemsjs.search(input);
    //console.log(result.data);
    //console.log(result.data.aggregations.tags);

    assert.deepEqual(result.data.aggregations.tags.buckets[0].key, 'a');
    assert.deepEqual(result.data.aggregations.tags.buckets[0].doc_count, 2);

    done();
  });
});

describe('generates symetrical disjunctive facets (SergeyRe)', function() {

  const aggregations = {
    a: {
      conjunction: false,
    },
    b: {
      conjunction: false,
    },
  };

  const items = [
    { a: 1, b: 3 },
    { a: 1, b: 4 },
    { a: 2, b: 3 },
    { a: 2, b: 4 }
  ];

  const facets = new Facets(items, {
    aggregations: aggregations
  });
  const itemsjs = require('./../index')(items, {
    aggregations: aggregations,
  });

  it('provides symetrical result', function test(done) {

    const input = {
      filters: {
        b: [3], a: [1]
      }
    };

    const result = facets.search(input, {
      test: true
    });

    assert.deepEqual(result.data.a['1'], [1]);
    assert.deepEqual(result.data.a['2'], [3]);
    assert.deepEqual(result.data.b['3'], [1]);
    assert.deepEqual(result.data.b['4'], [2]);

    done();
  });
});

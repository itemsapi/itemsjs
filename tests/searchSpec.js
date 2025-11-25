import assert from 'node:assert';
import itemsJS from '../src/index.js';
import { clone } from 'lodash-es';
import { readFileSync } from 'node:fs';
const items = JSON.parse(readFileSync('./tests/fixtures/items.json'));
const movies = JSON.parse(readFileSync('./tests/fixtures/movies.json'));

let itemsjs = itemsJS();

describe('search', function () {
  const configuration = {
    searchableFields: ['name', 'category', 'actors', 'name'],
    aggregations: {
      tags: {
        title: 'Tags',
        conjunction: true,
      },
      actors: {
        title: 'Actors',
        conjunction: true,
      },
      year: {
        title: 'Year',
        conjunction: true,
      },
      in_cinema: {
        title: 'Is played in Cinema',
        conjunction: true,
      },
      category: {
        title: 'Category',
        conjunction: true,
      },
    },
  };

  it('index is empty so cannot search', function test(done) {
    try {
      itemsjs.search();
    } catch (err) {
      assert.equal(err.message, 'index first then search');
    }

    done();
  });

  it('searches no params', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({});

    assert.equal(result.data.items.length, 4);
    assert.deepEqual(result.data.items[0].category, 'drama');
    assert.deepEqual(result.data.items[0].year, 1995);
    assert.deepEqual(result.data.items[0].in_cinema, false);

    assert.deepEqual(result.data.items[0].in_cinema, false);
    assert.equal(result.data.aggregations.in_cinema.buckets[0].doc_count, 3);
    assert.equal(result.data.aggregations.in_cinema.buckets[1].doc_count, 1);
    assert.equal(result.data.aggregations.in_cinema.buckets.length, 2);

    //console.log(result.data.aggregations.category);
    //console.log(result.data.aggregations.in_cinema);
    //console.log(result.data.aggregations.year);
    done();
  });

  it('searches no items with filters and query', function test(done) {
    const itemsjs = itemsJS([], configuration);

    const result = itemsjs.search({
      filters: {
        tags: ['a'],
        category: ['drama'],
      },
      query: 'comedy',
    });

    assert.equal(result.data.items.length, 0);
    assert.equal(result.data.aggregations.in_cinema.buckets.length, 0);
    assert.equal(result.data.aggregations.category.buckets.length, 0);
    assert.equal(result.data.aggregations.year.buckets.length, 0);

    done();
  });

  it('searches with two filters', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters: {
        tags: ['a'],
        category: ['drama'],
      },
    });

    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 2);

    done();
  });

  it('searches with filters query', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters_query: 'tags:c',
    });

    assert.equal(result.data.items.length, 3);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 3);

    done();
  });

  it('searches with filters query and filters', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters_query: 'tags:c',
      filters: {
        tags: ['z'],
      },
    });

    assert.equal(result.data.items.length, 1);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 1);

    done();
  });

  it('searches with filters query not existing value', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters_query: 'tags:not_existing',
    });

    assert.equal(result.data.items.length, 0);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 0);

    done();
  });

  it('searches with filter and query', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters: {
        tags: ['a'],
      },
      query: 'comedy',
    });

    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 2);
    assert.equal(result.data.aggregations.category.buckets[0].key, 'comedy');
    assert.equal(result.data.aggregations.category.buckets[0].doc_count, 2);

    done();
  });

  it('makes search with empty filters', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters: {},
    });

    assert.equal(result.data.items.length, 4);

    done();
  });

  it('makes search with not filters', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      not_filters: {
        tags: ['c'],
      },
    });

    assert.equal(result.data.items.length, 1);

    done();
  });

  it('makes search with many not filters', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      not_filters: {
        tags: ['c', 'e'],
      },
    });

    assert.equal(result.data.items.length, 0);

    done();
  });

  it('ignores not filters for values not present in index', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      not_filters: {
        tags: ['not-existing'],
      },
    });

    assert.equal(result.data.items.length, 4);

    done();
  });

  it('marks boolean facets as selected', function test(done) {
    const dataset = [
      { boolean: true, string: 'true' },
      { boolean: false, string: 'false' },
    ];

    const itemsjs = itemsJS(dataset, {
      aggregations: {
        boolean: {},
        string: {},
      },
    });

    const result = itemsjs.search({
      filters: {
        boolean: [true],
        string: ['true'],
      },
    });

    const booleanBuckets = result.data.aggregations.boolean.buckets;
    const stringBuckets = result.data.aggregations.string.buckets;

    assert.equal(booleanBuckets[0].key, 'true');
    assert.equal(booleanBuckets[0].selected, true);
    assert.equal(stringBuckets[0].selected, true);

    done();
  });

  it('aggregation does not mutate configured facet size', function test(done) {
    const smallDataset = [
      { id: 1, tags: ['a'] },
      { id: 2, tags: ['b'] },
      { id: 3, tags: ['c'] },
    ];

    const itemsjs = itemsJS(smallDataset, {
      aggregations: {
        tags: { size: 1 },
      },
    });

    const initial = itemsjs.search({});
    assert.equal(initial.data.aggregations.tags.buckets.length, 1);

    const aggResult = itemsjs.aggregation({ name: 'tags', per_page: 10 });
    assert.equal(aggResult.data.buckets.length, 3);

    const after = itemsjs.search({});
    assert.equal(after.data.aggregations.tags.buckets.length, 1);

    done();
  });

  it('normalizes pagination values to safe defaults', function test(done) {
    const dataset = Array.from({ length: 15 }, (_, idx) => ({
      id: idx + 1,
      tags: ['t' + (idx % 3)],
    }));

    const itemsjs = itemsJS(dataset, {
      aggregations: {
        tags: {},
      },
    });

    const result = itemsjs.search({
      per_page: Infinity,
      page: -5,
    });

    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.per_page, 12);
    assert.equal(result.data.items.length, 12);

    const resultString = itemsjs.search({
      per_page: 'abc',
      page: 'not-a-number',
    });

    assert.equal(resultString.pagination.page, 1);
    assert.equal(resultString.pagination.per_page, 12);
    assert.equal(resultString.data.items.length, 12);

    const zeroPerPage = itemsjs.search({
      per_page: 0,
      page: 3,
    });
    assert.equal(zeroPerPage.pagination.per_page, 0);
    assert.equal(zeroPerPage.pagination.page, 1);
    assert.equal(zeroPerPage.data.items.length, 0);

    done();
  });

  it('supports runtime facets overrides (OR + size, alias facets in response)', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      facets: {
        tags: {
          selected: ['c', 'e'],
          options: {
            conjunction: 'OR',
            size: 2,
            sortBy: 'key',
            sortDir: 'asc',
            hideZero: true,
            chosenOnTop: true,
          },
        },
      },
    });

    // default conjunction (AND) would return 0 for ['c','e'], OR should return matches
    assert.equal(result.pagination.total, 4);

    // alias facets present
    assert.ok(result.data.facets);
    assert.equal(
      result.data.facets,
      result.data.aggregations
    );

    const buckets = result.data.aggregations.tags.buckets;
    // size override applied
    assert.equal(buckets.length, 2);
    // selected value should be marked
    assert.equal(
      buckets.some((b) => b.key === 'c' && b.selected === true),
      true,
    );

    done();
  });

  it('makes search with non existing filter value with conjunction true should return no results', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters: {
        category: ['drama', 'thriller'],
      },
    });

    assert.equal(result.data.items.length, 0);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 0);

    done();
  });

  it('makes search with non existing filter value with conjunction false should return results', function test(done) {
    const localConfiguration = clone(configuration);
    localConfiguration.aggregations.category.conjunction = false;

    const itemsjs = itemsJS(items, localConfiguration);

    const result = itemsjs.search({
      filters: {
        category: ['drama', 'thriller'],
      },
    });

    assert.equal(result.data.items.length, 2);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 2);

    done();
  });

  it('makes search with non existing single filter value with conjunction false should return no results', function test(done) {
    const localConfiguration = clone(configuration);
    localConfiguration.aggregations.category.conjunction = false;

    const itemsjs = itemsJS(items, configuration);

    const result = itemsjs.search({
      filters: {
        category: ['thriller'],
      },
    });

    assert.equal(result.data.items.length, 0);
    assert.equal(result.data.aggregations.tags.buckets[0].doc_count, 0);

    done();
  });

  it('throws an error if name does not exist', function test(done) {
    const itemsjs = itemsJS(items, {
      native_search_enabled: false,
    });

    try {
      itemsjs.search({
        query: 'xxx',
      });
    } catch (err) {
      assert.equal(
        err.message,
        'The "query" option is not working once native search is disabled'
      );
    }

    done();
  });
});

describe('no configuration', function () {
  const configuration = {
    aggregations: {},
  };

  before(function (done) {
    itemsjs = itemsJS(items, configuration);
    done();
  });

  it('searches with two filters', function test(done) {
    const result = itemsjs.search({});

    assert.equal(result.data.items.length, 4);

    done();
  });

  it('searches with filter', function test(done) {
    const itemsjs = itemsJS(items, configuration);

    let result = itemsjs.search({
      filter: function () {
        return false;
      },
    });

    assert.equal(result.data.items.length, 0);

    result = itemsjs.search({});

    assert.equal(result.data.items.length, 4);
    done();
  });
});

describe('custom fulltext integration', function () {
  const configuration = {
    aggregations: {
      tags: {},
      year: {},
    },
  };

  before(function (done) {
    itemsjs = itemsJS(movies, configuration);
    done();
  });

  it('makes faceted search after separated quasi fulltext with _ids', function test(done) {
    let i = 1;
    const temp_movies = movies.map((v) => {
      v._id = i++;
      return v;
    });

    const result = itemsjs.search({
      _ids: temp_movies.map((v) => v._id).slice(0, 1),
    });

    assert.equal(result.data.items.length, 1);
    done();
  });

  it('makes faceted search after separated quasi fulltext with ids', function test(done) {
    let i = 10;
    const temp_movies = movies.map((v) => {
      v.id = i;
      i += 10;
      return v;
    });

    itemsjs = itemsJS(temp_movies, configuration);

    let result = itemsjs.search({
      ids: temp_movies.map((v) => v.id).slice(0, 1),
    });

    assert.equal(result.data.items[0].id, 10);
    assert.equal(result.data.items[0]._id, 1);
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      ids: [50, 20],
    });

    assert.equal(result.data.items[0].id, 50);
    assert.equal(result.data.items[0]._id, 5);
    assert.equal(result.data.items.length, 2);
    done();
  });
  it('makes faceted search after separated quasi fulltext with ids and filter', function test(done) {
    let i = 10;
    const temp_movies = movies.map((v) => {
      v.id = i;
      i += 10;
      return v;
    });

    itemsjs = itemsJS(temp_movies, configuration);

    let result = itemsjs.search({
      ids: [50, 20, 10],
      filter: function (v) {
        return v.id === 10;
      },
    });

    assert.equal(result.data.items[0].id, 10);
    assert.equal(result.data.items[0]._id, 1);
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      ids: [50, 20],
      filter: function (v) {
        return v.id === 10;
      },
    });

    assert.equal(result.data.items.length, 0);
    done();
  });

  it('makes faceted search after separated quasi fulltext with custom id field', function test(done) {
    let i = 10;
    const temp_movies = movies.map((v) => {
      v.uuid = i;
      i += 10;
      delete v.id;
      return v;
    });

    configuration.custom_id_field = 'uuid';

    itemsjs = itemsJS(temp_movies, configuration);

    let result = itemsjs.search({
      ids: temp_movies.map((v) => v.uuid).slice(0, 1),
    });

    assert.equal(result.data.items[0].uuid, 10);
    assert.equal(result.data.items[0]._id, 1);
    assert.equal(result.data.items.length, 1);

    result = itemsjs.search({
      ids: [50, 20],
    });

    assert.equal(result.data.items[0].uuid, 50);
    assert.equal(result.data.items[0]._id, 5);
    assert.equal(result.data.items.length, 2);
    done();
  });
});

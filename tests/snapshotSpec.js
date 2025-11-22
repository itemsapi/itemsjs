import assert from 'node:assert';
import itemsJS from '../src/index.js';
import { readFileSync } from 'node:fs';
import { Fulltext } from '../src/fulltext.js';

describe('snapshot serialization', function () {
  const data = [
    { id: 'a', name: 'Alpha', tags: ['t1', 't2'] },
    { id: 'b', name: 'Beta', tags: ['t2'] },
    { id: 'c', name: 'Gamma', tags: ['t3'] },
  ];

  const config = {
    searchableFields: ['name', 'tags'],
    aggregations: {
      tags: { title: 'Tags' },
    },
  };
  const itemsFixture = JSON.parse(readFileSync('./tests/fixtures/items.json'));
  const fixtureConfig = {
    searchableFields: ['name', 'category', 'actors', 'name'],
    aggregations: {
      tags: { title: 'Tags', conjunction: true },
      actors: { title: 'Actors', conjunction: true },
      year: { title: 'Year', conjunction: true },
      in_cinema: { title: 'Is played in Cinema', conjunction: true },
      category: { title: 'Category', conjunction: true },
    },
  };

  it('restores fulltext from snapshot', function () {
    const fulltext = new Fulltext(data, config);
    const snap = fulltext.serialize();

    const restored = new Fulltext([], { fulltextSnapshot: snap });
    assert.deepEqual(restored.search('alpha'), [1]);
    assert.deepEqual(restored.search('t3'), [3]);
  });

  it('restores itemsjs fulltext + facets from snapshot', function () {
    const engine = itemsJS(data, config);
    const initial = engine.search({
      query: 't2',
      filters: { tags: ['t1'] },
    });

    const snapshot = engine.serializeAll();

    const restored = itemsJS(data, {
      ...config,
      fulltextSnapshot: snapshot.fulltext,
      facetsSnapshot: snapshot.facets,
    });

    const after = restored.search({
      query: 't2',
      filters: { tags: ['t1'] },
    });

    assert.deepEqual(
      after.data.items.map((v) => v.id),
      initial.data.items.map((v) => v.id),
    );
    assert.deepEqual(
      after.data.aggregations.tags.buckets,
      initial.data.aggregations.tags.buckets,
    );
  });

  it('matches full search + facets against fixture data', function () {
    const engine = itemsJS(itemsFixture, fixtureConfig);
    const searchInput = {
      query: 'comedy',
      filters: {
        tags: ['a'],
      },
      per_page: 10,
    };

    const fresh = engine.search(searchInput);
    const snap = engine.serializeAll();

    const restored = itemsJS(itemsFixture, {
      ...fixtureConfig,
      fulltextSnapshot: snap.fulltext,
      facetsSnapshot: snap.facets,
    });
    const loaded = restored.search(searchInput);

    assert.deepEqual(
      loaded.data.items.map((v) => v.name),
      fresh.data.items.map((v) => v.name),
    );
    assert.equal(loaded.pagination.total, fresh.pagination.total);
    assert.deepEqual(
      loaded.data.aggregations.tags.buckets,
      fresh.data.aggregations.tags.buckets,
    );
  });
});

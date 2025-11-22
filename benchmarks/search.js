import itemsjs from '../src/index.js';
import { performance } from 'node:perf_hooks';

const defaultSizes = [1000, 10000, 30000];
const sizes = process.env.SIZES
  ? process.env.SIZES.split(',').map((v) => parseInt(v, 10)).filter(Boolean)
  : defaultSizes;

const repeats = parseInt(process.env.REPEAT || '5', 10);

const tagsPool = Array.from({ length: 40 }, (_, i) => `tag${i}`);
const actorsPool = Array.from({ length: 30 }, (_, i) => `actor${i}`);
const categories = ['catA', 'catB', 'catC', 'catD'];

function makeItems(count) {
  return Array.from({ length: count }, (_, i) => {
    const t1 = tagsPool[i % tagsPool.length];
    const t2 = tagsPool[(i * 7) % tagsPool.length];
    const t3 = tagsPool[(i * 11) % tagsPool.length];
    const actor = actorsPool[i % actorsPool.length];
    const category = categories[i % categories.length];
    const popular = i % 2 === 0;

    return {
      id: `id-${i}`,
      name: `Item ${i} ${t1}`,
      tags: [t1, t2, t3],
      actors: [actor],
      category,
      popular,
    };
  });
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function runScenario(engine, input) {
  const totals = [];
  const facets = [];
  const searchTimes = [];
  const sortingTimes = [];

  for (let i = 0; i < repeats; i++) {
    const start = performance.now();
    const res = engine.search(input);
    const end = performance.now();

    totals.push(end - start);
    facets.push(res.timings?.facets ?? 0);
    searchTimes.push(res.timings?.search ?? 0);
    sortingTimes.push(res.timings?.sorting ?? 0);
  }

  return {
    totalMs: average(totals),
    facetsMs: average(facets),
    searchMs: average(searchTimes),
    sortingMs: average(sortingTimes),
  };
}

function logResult(size, buildMs, results) {
  console.log(`items: ${size}`);
  console.log(`  build (ms): ${buildMs.toFixed(1)}`);
  Object.entries(results).forEach(([name, data]) => {
    console.log(
      `  ${name}: total=${data.totalMs.toFixed(2)}ms facets=${data.facetsMs.toFixed(
        2,
      )}ms search=${data.searchMs.toFixed(2)}ms sorting=${data.sortingMs.toFixed(2)}ms`,
    );
  });
  console.log('');
}

function main() {
  console.log(
    `Search benchmark – sizes: ${sizes.join(
      ', ',
    )}, repeats per scenario: ${repeats}`,
  );
  console.log(
    'Scenarios: empty, query-only, filters-only, query+filters, boolean filter',
  );
  console.log('');

  sizes.forEach((size) => {
    const data = makeItems(size);
    const config = {
      searchableFields: ['name', 'tags', 'actors'],
      aggregations: {
        tags: { title: 'Tags', size: tagsPool.length },
        actors: { title: 'Actors', size: actorsPool.length },
        category: { title: 'Category', size: categories.length },
        popular: { title: 'Popular' },
      },
    };

    const buildStart = performance.now();
    const engine = itemsjs(data, config);
    const buildEnd = performance.now();

    const scenarios = {
      empty: {},
      query: { query: tagsPool[1] },
      filters: {
        filters: {
          tags: [tagsPool[2]],
          category: [categories[1]],
        },
      },
      queryAndFilters: {
        query: tagsPool[3],
        filters: {
          tags: [tagsPool[3]],
          actors: [actorsPool[2]],
        },
      },
      booleanFilter: {
        filters: {
          popular: [true],
        },
      },
    };

    const results = {};
    Object.entries(scenarios).forEach(([name, input]) => {
      results[name] = runScenario(engine, input);
    });

    logResult(size, buildEnd - buildStart, results);
  });
}

main();

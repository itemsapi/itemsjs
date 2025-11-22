import itemsjs from '../src/index.js';
import { performance } from 'node:perf_hooks';

const defaultSizes = [1000, 10000, 30000];
const sizes = process.env.SIZES
  ? process.env.SIZES.split(',').map((v) => parseInt(v, 10)).filter(Boolean)
  : defaultSizes;

const tagsPool = Array.from({ length: 40 }, (_, i) => `tag${i}`);

function makeItems(count) {
  return Array.from({ length: count }, (_, i) => {
    const t1 = tagsPool[i % tagsPool.length];
    const t2 = tagsPool[(i * 7) % tagsPool.length];
    const t3 = tagsPool[(i * 13) % tagsPool.length];
    return {
      id: `id-${i}`,
      name: `Item ${i} ${t1}`,
      tags: [t1, t2, t3],
    };
  });
}

function runBenchmark(count) {
  const data = makeItems(count);
  const config = {
    searchableFields: ['name', 'tags'],
    aggregations: {
      tags: { title: 'Tags', size: tagsPool.length },
    },
  };

  const t0 = performance.now();
  const engine = itemsjs(data, config);
  const t1 = performance.now();

  const snapshot = engine.serializeAll();
  const t2 = performance.now();

  const snapshotJson = JSON.stringify(snapshot);
  const t3 = performance.now();

  itemsjs(data, {
    ...config,
    fulltextSnapshot: snapshot.fulltext,
    facetsSnapshot: snapshot.facets,
  });
  const t4 = performance.now();

  return {
    build: t1 - t0,
    serialize: t2 - t1,
    stringify: t3 - t2,
    load: t4 - t3,
    snapshotSizeMb: snapshotJson.length / (1024 * 1024),
    counts: data.length,
    speedup: (t1 - t0) / (t4 - t3),
  };
}

function formatMs(value) {
  return value.toFixed(1);
}

console.log('Snapshot benchmark (Node) – sizes:', sizes.join(', '));
console.log('Fields: name, tags (3 tags per item), 1 facet (tags)');
console.log('');

sizes.forEach((size) => {
  const result = runBenchmark(size);
  console.log(`items: ${result.counts}`);
  console.log(`  build fresh (ms): ${formatMs(result.build)}`);
  console.log(`  serialize (ms):    ${formatMs(result.serialize)}`);
  console.log(`  stringify (ms):    ${formatMs(result.stringify)}`);
  console.log(`  load snapshot (ms):${formatMs(result.load)}`);
  console.log(`  snapshot size (MB):${result.snapshotSizeMb.toFixed(2)}`);
  console.log(`  cold-start speedup (build/load): ${result.speedup.toFixed(2)}x`);
  console.log('');
});

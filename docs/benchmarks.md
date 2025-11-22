# Benchmarks

This folder contains small, reproducible benchmarks for ItemsJS. They are optional and not part of the published package.

## Snapshot benchmark

Script: `npm run benchmark:snapshot`

- Compares fresh index build vs loading from snapshot.
- Defaults: sizes `1000,10000,30000`. Override with `SIZES=5000,20000 npm run benchmark:snapshot`.
- Output includes cold-start speedup (build/load) and snapshot size.
- Note: In the browser, total cost also includes `fetch + JSON.parse` if you download the snapshot.

## Search benchmark

Script: `npm run benchmark:search`

- Measures build/search/facets timings across scenarios: empty, query-only, filters-only, query+filters, boolean filter.
- Defaults: sizes `1000,10000,30000`, repeats per scenario `5`.
- Override: `SIZES=5000,20000`, `REPEAT=10`.
- Dataset per size: 40 tags, 30 actors, 4 categories, boolean `popular`; each item has 3 tags, 1 actor, 1 category. Facets: tags, actors, category, popular. Searchable fields: name (boosted), tags, actors.
- Stress facet-heavy setups with `EXTRA_FACETS=1000` (each with 3 values) to see scaling for many facets.

## Browser smoke test

- Build: `npm run build`.
- Run: `npm run serve:benchmark` and open `http://localhost:4173/` (serves `benchmarks/browser-snapshot.html`), or open the HTML directly.
- First load builds and stores a snapshot in `localStorage`; subsequent loads use the snapshot and log a sample search. Green message = OK; red/error or stuck on “Loading…” → check console.

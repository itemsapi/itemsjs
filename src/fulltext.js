import lunr from 'lunr';

/**
 * responsible for making full text searching on items
 * config provide only searchableFields
 */
export class Fulltext {
  constructor(items, config) {
    this.store = new Map();

    // creating index
    this.idx = lunr(function () {
      // currently schema hardcoded
      this.field('name', { boost: 10 });

      const searchableFields = config?.searchableFields || [];
      searchableFields.forEach((field) => this.field(field));
      this.ref('_id');

      /**
       * Remove the stemmer and stopWordFilter from the pipeline
       * stemmer: https://github.com/olivernn/lunr.js/issues/328
       * stopWordFilter: https://github.com/olivernn/lunr.js/issues/233
       */
      if (config?.isExactSearch) {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
      }

      /**
       * Remove the stopWordFilter from the pipeline
       * stopWordFilter: https://github.com/itemsapi/itemsjs/issues/46
       */
      if (config?.removeStopWordFilter) {
        this.pipeline.remove(lunr.stopWordFilter);
      }
    });

    let i = 1;
    (items || []).map((item) => {
      item._id = i;
      ++i;

      this.idx.add(item);
      this.store.set(item._id, item);
    });
  }

  search_full(query, filter) {
    return this.search(query, filter).map((v) => this.store.get(v));
  }

  search(query, filter) {
    if (!(filter instanceof Function)) {
      if (!query) {
        return [...this.store.keys()];
      } else {
        return this.idx.search(query).map((v) => v.ref);
      }
    }

    const items = query
      ? this.idx.search(query).map((v) => this.store.get(v.ref))
      : [...this.store.values()];

    return items.filter(filter).map((v) => v._id);
  }
}

import { forEach, map, mapKeys } from 'lodash-es';
import lunr from 'lunr';

/**
 * responsible for making full text searching on items
 * config provide only searchableFields
 */
export class Fulltext {
  constructor(items, config) {
    config = config || Object.create(null);
    config.searchableFields = config.searchableFields || [];
    this.items = items;
    // creating index
    this.idx = lunr(function () {
      // currently schema hardcoded
      this.field('name', { boost: 10 });

      const self = this;
      forEach(config.searchableFields, function (field) {
        self.field(field);
      });
      this.ref('_id');

      /**
       * Remove the stemmer and stopWordFilter from the pipeline
       * stemmer: https://github.com/olivernn/lunr.js/issues/328
       * stopWordFilter: https://github.com/olivernn/lunr.js/issues/233
       */
      if (config.isExactSearch) {
        this.pipeline.remove(lunr.stemmer);
        this.pipeline.remove(lunr.stopWordFilter);
      }

      /**
       * Remove the stopWordFilter from the pipeline
       * stopWordFilter: https://github.com/itemsapi/itemsjs/issues/46
       */
      if (config.removeStopWordFilter) {
        this.pipeline.remove(lunr.stopWordFilter);
      }
    });

    let i = 1;

    map(items, (item) => {
      item._id = i;
      ++i;

      this.idx.add(item);
    });

    this.store = mapKeys(items, (doc) => {
      return doc._id;
    });
  }

  search_full(query, filter) {
    return this.search(query, filter).map((v) => {
      return this.store[v];
    });
  }

  search(query, filter) {
    if (!query && !filter) {
      return this.items ? this.items.map((v) => v._id) : [];
    }

    let items;

    if (query) {
      items = map(this.idx.search(query), (val) => {
        const item = this.store[val.ref];
        return item;
      });
    }

    if (filter instanceof Function) {
      items = (items || this.items).filter(filter);
    }

    return items.map((v) => v._id);
  }
}

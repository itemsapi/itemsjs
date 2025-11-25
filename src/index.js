import { search, similar, aggregation } from './lib.js';
import {
  mergeAggregations,
  buildFiltersQueryFromFacets,
  normalizeRuntimeFacetConfig,
} from './helpers.js';
import { Fulltext } from './fulltext.js';
import { Facets } from './facets.js';

function itemsjs(items, configuration) {
  configuration = configuration || Object.create(null);

  // upsert id to items
  // throw error in tests if id does not exists

  let fulltext;
  if (configuration.native_search_enabled !== false) {
    fulltext = new Fulltext(items, configuration);
  }

  // index facets
  let facets = new Facets(items, configuration);

  return {
    /**
     * per_page
     * page
     * query
     * sort
     * filters
     */
    search: function (input) {
      input = input || Object.create(null);

      // allow runtime facet options via input.facets (alias for aggregations/filters)
      let effectiveConfiguration = configuration;
      if (input.facets) {
        const { aggregations, filters } = normalizeRuntimeFacetConfig(
          input.facets,
          configuration,
        );

        effectiveConfiguration = {
          ...configuration,
          aggregations,
        };

        // merge filters so buckets can mark selected values
        if (filters) {
          input.filters = {
            ...(input.filters || {}),
            ...filters,
          };
        }

        if (!input.filters_query) {
          const filters_query = buildFiltersQueryFromFacets(
            input.facets,
            effectiveConfiguration,
          );
          if (filters_query) {
            input.filters_query = filters_query;
          }
        }

        // Facets instance keeps reference to config; update for this run
        facets.config = effectiveConfiguration.aggregations;
      } else {
        facets.config = configuration.aggregations;
      }

      /**
       * merge configuration aggregation with user input
       */
      input.aggregations = mergeAggregations(
        effectiveConfiguration.aggregations,
        input,
      );

      const result = search(
        items,
        input,
        effectiveConfiguration,
        fulltext,
        facets,
      );

      if (result?.data?.aggregations && !result.data.facets) {
        result.data.facets = result.data.aggregations;
      }

      return result;
    },

    /**
     * returns list of similar elements to specified item id
     * id
     */
    similar: function (id, options) {
      return similar(items, id, options);
    },

    /**
     * returns list of elements for specific aggregation i.e. list of tags
     * name (aggregation name)
     * query
     * per_page
     * page
     */
    aggregation: function (input) {
      let aggregationConfiguration = configuration;

      if (input?.facets) {
        const { aggregations } = normalizeRuntimeFacetConfig(
          input.facets,
          configuration,
        );

        aggregationConfiguration = {
          ...configuration,
          aggregations,
        };

        facets.config = aggregationConfiguration.aggregations;
      } else {
        facets.config = configuration.aggregations;
      }

      return aggregation(
        items,
        input,
        aggregationConfiguration,
        fulltext,
        facets,
      );
    },

    /**
     * reindex items
     * reinitialize fulltext search
     */
    reindex: function (newItems) {
      items = newItems;
      fulltext = new Fulltext(items, configuration);
      facets = new Facets(items, configuration);
    },

    /**
     * export snapshots for faster cold starts
     */
    serializeFulltext: function () {
      if (!fulltext) {
        return null;
      }
      return fulltext.serialize();
    },

    serializeFacets: function () {
      return facets.serialize();
    },

    serializeAll: function () {
      return {
        version: 'itemsjs-snapshot-v1',
        fulltext: this.serializeFulltext(),
        facets: this.serializeFacets(),
      };
    },
  };
}

export default itemsjs;

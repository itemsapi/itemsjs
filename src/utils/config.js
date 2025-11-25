import booleanParser from 'boolean-parser';

export const mergeAggregations = function (aggregations, input) {
  const result = {};

  for (const key in aggregations) {
    const val = { ...aggregations[key] };

    val.field = val.field || key;
    val.filters = (input.filters && input.filters[key]) || [];
    val.not_filters =
      (input.exclude_filters && input.exclude_filters[key]) ||
      (input.not_filters && input.not_filters[key]) ||
      [];

    result[key] = val;
  }

  return result;
};

export const input_to_facet_filters = function (input, config) {
  const filters = [];

  for (const key in input.filters) {
    const values = input.filters[key];
    if (values && values.length) {
      if (config[key]?.conjunction !== false) {
        values.forEach((value) => {
          filters.push([key, value]);
        });
      } else {
        const temp = values.map((value) => [key, value]);
        filters.push(temp);
      }
    }
  }

  for (const key in input.not_filters) {
    const values = input.not_filters[key];
    if (values && values.length) {
      values.forEach((value) => {
        filters.push([key, '-', value]);
      });
    }
  }

  return filters;
};

export const parse_boolean_query = function (query) {
  const result = booleanParser.parseBooleanQuery(query);

  return result.map((v1) => {
    if (Array.isArray(v1)) {
      return v1.map((v2) => {
        if (Array.isArray(v2)) {
          return v2.map((v3) => {
            return v3;
          });
        } else {
          return v2.split(':');
        }
      });
    } else {
      return v1.split(':');
    }
  });
};

/**
 * Builds a boolean query string from runtime facet selections.
 * Respects per-facet conjunction (AND/OR). Unknown facets are ignored.
 */
export const buildFiltersQueryFromFacets = function (facets, configuration) {
  if (!facets || typeof facets !== 'object') {
    return;
  }

  const aggregations = (configuration && configuration.aggregations) || {};
  const expressions = [];

  Object.keys(facets).forEach((facetName) => {
    if (!aggregations[facetName]) {
      return;
    }

    const selected = facets[facetName]?.selected || [];
    if (!Array.isArray(selected) || selected.length === 0) {
      return;
    }

    const conjunction =
      facets[facetName]?.options?.conjunction === 'OR' ? 'OR' : 'AND';

    const parts = selected.map((val) => {
      const stringVal = String(val);
      if (stringVal.includes(' ') || stringVal.includes(':')) {
        return `${facetName}:"${stringVal.replace(/"/g, '\\"')}"`;
      }
      return `${facetName}:${stringVal}`;
    });

    let expr;
    if (conjunction === 'OR') {
      expr = parts.length > 1 ? `(${parts.join(' OR ')})` : parts[0];
    } else {
      expr = parts.join(' AND ');
    }

    expressions.push(expr);
  });

  if (!expressions.length) {
    return;
  }

  return expressions.join(' AND ');
};

/**
 * Builds per-facet filters and temporary aggregation overrides based on runtime options.
 */
export const normalizeRuntimeFacetConfig = function (facets, configuration) {
  const baseAggregations = (configuration && configuration.aggregations) || {};
  const filters = Object.create(null);
  let hasFilters = false;

  const newAggregations = { ...baseAggregations };

  Object.keys(facets || {}).forEach((facetName) => {
    const facetConfig = baseAggregations[facetName];
    if (!facetConfig) {
      return;
    }

    const selected = facets[facetName]?.selected;
    if (Array.isArray(selected) && selected.length) {
      filters[facetName] = selected;
      hasFilters = true;
    }

    const options = facets[facetName]?.options;
    if (options) {
      const mapped = {};

      if (options.conjunction) {
        mapped.conjunction = options.conjunction !== 'OR';
      }

      if (typeof options.size === 'number') {
        mapped.size = options.size;
      }

      if (options.sortBy === 'key') {
        mapped.sort = 'key';
        mapped.order = options.sortDir || facetConfig.order;
      } else if (options.sortBy === 'count') {
        mapped.sort = undefined;
        mapped.order = options.sortDir || facetConfig.order;
      } else if (options.sortDir) {
        mapped.order = options.sortDir;
      }

      if (typeof options.hideZero === 'boolean') {
        mapped.hide_zero_doc_count = options.hideZero;
      }

      if (typeof options.chosenOnTop === 'boolean') {
        mapped.chosen_filters_on_top = options.chosenOnTop;
      }

      if (typeof options.showStats === 'boolean') {
        mapped.show_facet_stats = options.showStats;
      }

      if (Object.keys(mapped).length) {
        newAggregations[facetName] = {
          ...baseAggregations[facetName],
          ...mapped,
        };
      }
    }
  });

  return {
    hasFilters,
    filters: hasFilters ? filters : undefined,
    aggregations: newAggregations,
  };
};

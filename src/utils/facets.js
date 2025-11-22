import FastBitSet from 'fastbitset';
import { combination_indexes, filters_matrix, matrix } from './facetsCore.js';

export { combination_indexes, filters_matrix, matrix };

export const filters_ids = function (facets_data) {
  return Object.values(facets_data).reduce((output, values) => {
    Object.values(values).forEach((facet_indexes) => {
      output = output.new_union(facet_indexes);
    });
    return output;
  }, new FastBitSet([]));
};

export const facets_ids = function (facets_data, filters) {
  if (!facets_data || typeof facets_data !== 'object') {
    throw new Error('Invalid facets_data provided.');
  }

  if (!filters || typeof filters !== 'object') {
    return null;
  }

  const allFilters = Object.entries(filters).flatMap(
    ([field, filterArray]) =>
      Array.isArray(filterArray)
        ? filterArray.map((filter) => ({ field, filter }))
        : []
  );

  if (allFilters.length === 0) {
    return null;
  }

  const output = allFilters.reduce((acc, { field, filter }) => {
    const bitset = facets_data[field]?.[filter] || new FastBitSet([]);
    return acc.new_union(bitset);
  }, new FastBitSet([]));

  return output;
};

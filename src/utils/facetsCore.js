import { clone as _clone } from 'lodash-es';
import FastBitSet from 'fastbitset';

export const combination_indexes = function (facets, filters) {
  const indexes = {};

  filters.forEach((filter) => {
    if (Array.isArray(filter[0])) {
      let facet_union = new FastBitSet();
      const filter_keys = new Set();

      filter.forEach((disjunctive_filter) => {
        const [filter_key, filter_val] = disjunctive_filter;
        filter_keys.add(filter_key);
        const bits =
          facets.bits_data[filter_key]?.[filter_val] || new FastBitSet();
        facet_union = facet_union.new_union(bits);
      });

      filter_keys.forEach((filter_key) => {
        indexes[filter_key] = facet_union;
      });
    }
  });

  return indexes;
};

export const filters_matrix = function (facets, query_filters) {
  const temp_facet = _clone(facets);

  if (!temp_facet.bits_data_temp) {
    temp_facet.bits_data_temp = {};
  }

  if (!temp_facet.is_temp_copied) {
    for (const key in temp_facet.bits_data) {
      temp_facet.bits_data_temp[key] = {};
      for (const key2 in temp_facet.bits_data[key]) {
        temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data[key][key2];
      }
    }
  }

  let union = null;

  if (Array.isArray(query_filters)) {
    query_filters.forEach((conjunction) => {
      let conjunctive_index = null;

      conjunction.forEach((filter) => {
        const [filter_key, filter_val] = filter;

        if (!temp_facet.bits_data_temp[filter_key]) {
          throw new Error('Panic. The key does not exist in facets lists.');
        }

        const facetData = temp_facet.bits_data_temp[filter_key][filter_val];

        if (facetData) {
          if (conjunctive_index) {
            conjunctive_index = conjunctive_index.new_intersection(facetData);
          } else {
            conjunctive_index = facetData;
          }
        } else {
          conjunctive_index = new FastBitSet();
        }
      });

      if (conjunctive_index) {
        if (union) {
          union = union.new_union(conjunctive_index);
        } else {
          union = conjunctive_index;
        }
      }
    });
  }

  if (union !== null) {
    for (const key in temp_facet.bits_data_temp) {
      for (const key2 in temp_facet.bits_data_temp[key]) {
        temp_facet.bits_data_temp[key][key2] =
          temp_facet.bits_data_temp[key][key2].new_intersection(union);
      }
    }
  }

  return temp_facet;
};

export const matrix = function (facets, filters = []) {
  const temp_facet = _clone(facets);

  temp_facet.bits_data_temp = {};
  for (const key in temp_facet.bits_data) {
    temp_facet.bits_data_temp[key] = {};
    for (const key2 in temp_facet.bits_data[key]) {
      temp_facet.bits_data_temp[key][key2] = temp_facet.bits_data[key][key2];
    }
  }

  temp_facet.is_temp_copied = true;

  let conjunctive_index;
  const disjunctive_indexes = combination_indexes(facets, filters);

  filters.forEach((filter) => {
    if (!Array.isArray(filter[0])) {
      const [filter_key, filter_val] = filter;
      const facetData = temp_facet.bits_data_temp[filter_key]?.[filter_val];

      if (conjunctive_index && facetData) {
        conjunctive_index = facetData.new_intersection(conjunctive_index);
      } else if (conjunctive_index && !facetData) {
        conjunctive_index = new FastBitSet([]);
      } else {
        conjunctive_index = facetData;
      }
    }
  });

  if (conjunctive_index) {
    for (const key in temp_facet.bits_data_temp) {
      for (const key2 in temp_facet.bits_data_temp[key]) {
        temp_facet.bits_data_temp[key][key2] =
          temp_facet.bits_data_temp[key][key2].new_intersection(
            conjunctive_index
          );
      }
    }
  }

  filters.forEach((filter) => {
    if (filter.length === 3 && filter[1] === '-') {
      const [filter_key, , filter_val] = filter;
      const negative_bits = temp_facet.bits_data_temp[filter_key][filter_val].clone();

      for (const key in temp_facet.bits_data_temp) {
        for (const key2 in temp_facet.bits_data_temp[key]) {
          temp_facet.bits_data_temp[key][key2] =
            temp_facet.bits_data_temp[key][key2].new_difference(negative_bits);
        }
      }
    }
  });

  for (const key in temp_facet.bits_data_temp) {
    for (const key2 in temp_facet.bits_data_temp[key]) {
      for (const disjunctive_key in disjunctive_indexes) {
        if (disjunctive_key !== key) {
          temp_facet.bits_data_temp[key][key2] =
            temp_facet.bits_data_temp[key][key2].new_intersection(
              disjunctive_indexes[disjunctive_key]
            );
        }
      }
    }
  }

  return temp_facet;
};

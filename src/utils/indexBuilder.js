import FastBitSet from 'fastbitset';

export const index = function (items = [], fields = []) {
  const facets = {
    data: Object.create(null),
    bits_data: Object.create(null),
    bits_data_temp: Object.create(null),
  };

  let nextId = 1;

  fields.forEach((field) => {
    facets.data[field] = Object.create(null);
  });

  items.forEach((item) => {
    if (!item._id) {
      item._id = nextId++;
    }
  });

  items.forEach((item) => {
    fields.forEach((field) => {
      const fieldValue = item[field];

      if (Array.isArray(fieldValue)) {
        fieldValue.forEach((value) => {
          if (!facets.data[field][value]) {
            facets.data[field][value] = [];
          }
          facets.data[field][value].push(item._id);
        });
      } else if (typeof fieldValue !== 'undefined') {
        const value = fieldValue;
        if (!facets.data[field][value]) {
          facets.data[field][value] = [];
        }
        facets.data[field][value].push(item._id);
      }
    });
  });

  Object.keys(facets.data).forEach((field) => {
    facets.bits_data[field] = Object.create(null);
    facets.bits_data_temp[field] = Object.create(null);

    const values = facets.data[field];
    Object.keys(values).forEach((filter) => {
      const indexes = values[filter];
      const sorted_indexes = indexes.sort((a, b) => a - b);
      facets.bits_data[field][filter] = new FastBitSet(sorted_indexes);
      facets.data[field][filter] = sorted_indexes;
    });
  });

  return facets;
};

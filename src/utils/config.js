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

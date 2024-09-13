import { map, keys } from 'lodash-es';
import FastBitSet from 'fastbitset';
import {
  facets_ids,
  filters_ids,
  filters_matrix,
  index,
  input_to_facet_filters,
  matrix,
  parse_boolean_query,
} from './helpers.js';

/**
 * responsible for making faceted search
 */
export class Facets {
  constructor(items, configuration) {
    configuration = configuration || Object.create(null);
    configuration.aggregations = configuration.aggregations || Object.create(null);
    this._items = items;
    this.config = configuration.aggregations;
    this.facets = index(items, keys(configuration.aggregations));

    this._items_map = Object.create(null);
    this._ids = [];

    let i = 1;
    map(items, (item) => {
      this._ids.push(i);
      this._items_map[i] = item;
      item._id = i;
      ++i;
    });

    this.ids_map = Object.create(null);

    if (items) {
      items.forEach((v) => {
        const custom_id_field = configuration.custom_id_field || 'id';
        if (v[custom_id_field] && v._id) {
          this.ids_map[v[custom_id_field]] = v._id;
        }
      });
    }

    this._bits_ids = new FastBitSet(this._ids);
  }

  items() {
    return this._items;
  }

  bits_ids(ids) {
    if (ids) {
      return new FastBitSet(ids);
    }
    return this._bits_ids;
  }

  internal_ids_from_ids_map(ids) {
    return ids.map((v) => {
      return this.ids_map[v];
    });
  }

  index() {
    return this.facets;
  }

  get_item(_id) {
    return this._items_map[_id];
  }

  search(input, data = {}) {
    const config = this.config;
    const temp_facet = {};

    temp_facet.not_ids = facets_ids(
      this.facets.bits_data,
      input.not_filters
    );

    const filters = input_to_facet_filters(input, config);
    let temp_data = matrix(this.facets, filters);

    if (input.filters_query) {
      const filtersQuery = parse_boolean_query(input.filters_query);
      temp_data = filters_matrix(temp_data, filtersQuery);
    }

    temp_facet.bits_data_temp = temp_data.bits_data_temp;
    const bitsDataTemp = temp_facet.bits_data_temp;

    if (data.query_ids) {
      for (const key in bitsDataTemp) {
        for (const key2 in bitsDataTemp[key]) {
          bitsDataTemp[key][key2] = data.query_ids.new_intersection(
            bitsDataTemp[key][key2]
          );
        }
      }
    }

    if (data.test) {
      temp_facet.data = {};
      for (const key in bitsDataTemp) {
        temp_facet.data[key] = {};
        for (const key2 in bitsDataTemp[key]) {
          temp_facet.data[key][key2] = bitsDataTemp[key][key2].array();
        }
      }
    }

    temp_facet.ids = input.filters_query
      ? filters_ids(bitsDataTemp)
      : facets_ids(bitsDataTemp, input.filters);

    return temp_facet;
  }
}

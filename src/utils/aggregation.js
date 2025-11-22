import {
  mapValues,
  isArray,
  orderBy,
  minBy,
  maxBy,
  sumBy,
  meanBy,
} from 'lodash-es';
import { humanize } from './object.js';

export const getBuckets = function (data, input, aggregations) {
  let position = 1;

  return mapValues(data['bits_data_temp'], (v, k) => {
    let order;
    let sort;
    let size;
    let title;
    let show_facet_stats;
    let chosen_filters_on_top;
    let hide_zero_doc_count;

    if (aggregations[k]) {
      order = aggregations[k].order;
      sort = aggregations[k].sort;
      size = aggregations[k].size;
      title = aggregations[k].title;
      show_facet_stats = aggregations[k].show_facet_stats || false;
      chosen_filters_on_top = aggregations[k].chosen_filters_on_top !== false;
      hide_zero_doc_count = aggregations[k].hide_zero_doc_count || false;
    }

    let buckets = Object.entries(v)
      .map((v2) => {
        let filters = [];

        if (input && input.filters && input.filters[k]) {
          filters = input.filters[k];
        }

        const doc_count = v2[1].array().length;
        const isSelected = filters.some((f) => String(f) === String(v2[0]));

        if (hide_zero_doc_count && doc_count === 0 && !isSelected) {
          return;
        }

        return {
          key: v2[0],
          doc_count: doc_count,
          selected: isSelected,
        };
      })
      .filter(Boolean);

    let iteratees;
    let sort_order;

    if (isArray(sort)) {
      iteratees = sort || ['key'];
      sort_order = order || ['asc'];
    } else {
      if (sort === 'term' || sort === 'key') {
        iteratees = ['key'];
        sort_order = [order || 'asc'];
      } else {
        iteratees = ['doc_count', 'key'];
        sort_order = [order || 'desc', 'asc'];
      }

      if (chosen_filters_on_top) {
        iteratees.unshift('selected');
        sort_order.unshift('desc');
      }
    }

    buckets = orderBy(buckets, iteratees, sort_order);

    buckets = buckets.slice(0, size || 10);

    let calculated_facet_stats;

    if (show_facet_stats) {
      const facet_stats = [];
      Object.entries(v).forEach((v2) => {
        if (isNaN(v2[0])) {
          throw new Error('You cant use chars to calculate the facet_stats.');
        }

        if (v2[1].array().length > 0) {
          v2[1].forEach(() => {
            facet_stats.push(parseInt(v2[0]));
          });
        }
      });

      calculated_facet_stats = {
        min: minBy(facet_stats),
        max: maxBy(facet_stats),
        avg: meanBy(facet_stats),
        sum: sumBy(facet_stats),
      };
    }

    return {
      name: k,
      title: title || humanize(k),
      position: position++,
      buckets: buckets,
      ...(show_facet_stats && { facet_stats: calculated_facet_stats }),
    };
  });
};

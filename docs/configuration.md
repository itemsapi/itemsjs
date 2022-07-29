# ItemsJS search configuration

## Configuration

```js
var itemsjs = require('itemsjs')(data, {
  sortings: {
    year_asc: {
      // field name in data
      field: 'year',
      // possible values asc or desc
      order: 'asc'
    },
    year_name_asc: {
      // Multiple criteria possible
      field: ['date', 'name'],
      order: ['asc', 'asc']
    }
  },
  aggregations: {
    tags: {
      title: 'Tags',
      // conjunctive facet (AND)
      conjunction: true,
      // sort can ben an array
      sort: ['selected', 'count', 'key']
      order: ['desc', 'desc', 'asc']
      // the default is 10
      size: 20
    },
    rating: {
      title: 'Actors',
      // non conjunctive facet (OR)
      conjunction: false,
      // it is sorting by value (not by count). 'count' is the default
      sort: 'key',
      order: 'asc',
      size: 5,
      // If you want to retrieve the min, max, avg, sum rating values from the whole filtered dataset
      show_facet_stats: true,
      // If you don't want selected filters to be positioned at the top of the filter list
      chosen_filters_on_top: false,
      // If you don't want to show filters with no results returned
      hide_zero_doc_count: true
    }
  },
  searchableFields: ['name', 'tags'],
});
```

## Searching

```js
// aggregation
var movies = itemsjs.search({
  per_page: 1,
  sort: 'year_asc', // key from itemsjs configuration `sortings` object
  filters: {
    tags: ['1980s']
  }
})
```

```js
// full text search
var movies = itemsjs.search({
  per_page: 1,
  sort: {
    // Custom sort not defined in configuration
    field: 'year',
    order: 'asc'
  },
  filters: {
    tags: ['1980s']
  }
})
```

```js
var result = itemsjs.search({
  query: 'shoes',
  filter: function(item) {
    return item.rating >= 8 && item.reviews_count >= 200;
  }
});
```

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
      // the default is 10
      size: 20
    },
    rating: {
      title: 'Actors',
      // non conjunctive facet (OR)
      conjunction: false,
      // it is sorting by value (not by count). 'count' is the default
      sort: 'term',
      order: 'asc',
      size: 5,
      // If you want to retrieve the min, max, avg, sum rating values from the whole filtered dataset
      show_facet_stats: true,
    }
  },
  searchableFields: ['name', 'tags'],
  isExactSearch: true // Default false
});
```

## Searching

```js
// aggregation
var movies = itemsjs.search({
  per_page: 1,
  sort: 'name_asc',
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

```js
var result = itemsjs.search({
  query: 'shoes',
  prefilter: function(items) {
    return items.filter(item => {
      return item.price > 100;
    });
  }
});
```

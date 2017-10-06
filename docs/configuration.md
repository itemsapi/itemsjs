# ItemsJS search configuration

```js
var itemsjs = require('itemsjs')(data, {
  sortings: {
    year_asc: {
      // field name in data
      field: 'year',
      // possible values asc or desc
      order: 'asc'
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
      size: 5
    }
  },
  searchableFields: ['name', 'tags']
});
```

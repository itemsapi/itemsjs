# ItemsJS - search engine in javascript 

Full text, faceted, dependency free search engine in javascript. 
Created to perform fast search on small json dataset (up to 1000 elements).

## Features

- faceted search
- full text
- pagination
- no dependencies (only javascript)

## Getting Started

```bash
npm install itemsjs
```

```js
const itemsjs = require('itemsjs')(data);
const items = itemsjs.search();
```

## Example

```bash
npm install itemsjs

# download json data
wget https://raw.githubusercontent.com/itemsapi/itemsapi-example-data/master/items/movies-processed.json -O data.json
```

Create `search.js`:

```js
var data = require('./data.json');

var itemsjs = require('itemsjs')(data, {
  aggregations: {
    tags: {
      title: 'Tags',
      size: 10
    },
    actors: {
      title: 'Actors',
      size: 10
    },
    genres: {
      title: 'Genres',
      size: 10
    }
  }
});

var result = itemsjs.search({
  per_page: 1,
  filters: {
    tags: ['1980s']
  }
})
console.log(JSON.stringify(result, null, 2));
```

```bash
node search.js
```



## Credit

- https://github.com/olivernn/lunr.js for providing full text search.

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
const itemsjs = require('itemsjs')(data, configuration);
const items = itemsjs.search();
```

or using from the client side:

```bash
bower install itemsjs
```

```html
<script src="/bower_components/itemsjs/dist/itemsjs.js"></script>
```

```js
itemsjs = itemsjs(data, configuration);
itemsjs.search()
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

/**
 * get filtered list of movies 
 */
var movies = itemsjs.search({
  per_page: 1,
  filters: {
    tags: ['1980s']
  }
})
console.log(JSON.stringify(movies, null, 2));

/**
 * get list of top tags 
 */
var top_tags = itemsjs.aggregation({
  name: 'tags',
  per_page: 10
})
console.log(JSON.stringify(top_tags, null, 2));
```

Test that with :

```bash
node search.js
```


## API

### var itemsjs = ItemsJS(data, [configuration])

#### `data`

The first `data` argument is an array of objects.

#### `configuration`

Responsible for defining global configuration 

  * **<code>aggregations</code>** filters configuration i.e. for `tags`, `actors`, `colors`, etc. Responsible for generating facets.

  * **<code>searchableFields</code>** an array of searchable fields.


### itemsjs.search(options)

#### `options`

  * **<code>per_page</code>** amount of items per page.

  * **<code>page</code>** page number - used for pagination.

  * **<code>query</code>** used for full text search.
  
  * **<code>filters</code>** filtering items based on specific aggregations i.e. {tags: ['drama' , 'historical']}  

### itemsjs.aggregation(options)

It returns full list of filters for specific aggregation

#### `options`

  * **<code>name</code>** aggregation name

  * **<code>per_page</code>** filters per page

  * **<code>page</code>** page number

  * **<code>query</code>** used for quering filters. It's not full text search
  
### itemsjs.reindex(data)

It's used in case you need to reindex the whole data

#### `data`

An array of objects.
  

## Credit

- [Lunr.js](https://github.com/olivernn/lunr.js) for providing full text search.

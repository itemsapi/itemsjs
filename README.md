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

Result

```json
{
  "pagination": {
    "per_page": 1,
    "page": 1,
    "total": 5
  },
  "data": {
    "items": [
      {
        "name": "Donnie Darko",
        "year": 2001,
        "director": [
          "Richard Kelly"
        ],
        "genres": [
          "Drama",
          "Sci-Fi",
          "Thriller"
        ],
        "tags": [
          "parallel universe",
          "insanity",
          "death",
          "time travel",
          "1980s"
        ],
        "country": [
          "USA"
        ]
      }
    ],
    "aggregations": {
      "tags": {
        "name": "tags",
        "title": "Tags",
        "position": 1,
        "buckets": [
          {
            "key": "1980s",
            "doc_count": 5
          },
          {
            "key": "arms dealer",
            "doc_count": 1
          },
          {
            "key": "band",
            "doc_count": 1
          },
          {
            "key": "business card",
            "doc_count": 1
          },
          {
            "key": "colonel",
            "doc_count": 1
          },
          {
            "key": "death",
            "doc_count": 1
          },
          {
            "key": "deputy",
            "doc_count": 1
          },
          {
            "key": "immorality",
            "doc_count": 1
          },
          {
            "key": "insanity",
            "doc_count": 1
          },
          {
            "key": "male rear nudity",
            "doc_count": 1
          }
        ]
      },
      "actors": {
        "name": "actors",
        "title": "Actors",
        "position": 2,
        "buckets": [
          {
            "key": "Jared Leto",
            "doc_count": 2
          },
          {
            "key": "Aidan Gillen",
            "doc_count": 1
          },
          {
            "key": "Alf Humphreys",
            "doc_count": 1
          },
          {
            "key": "Arthur Taxier",
            "doc_count": 1
          },
          {
            "key": "Ben Carolan",
            "doc_count": 1
          },
          {
            "key": "Bill McKinney",
            "doc_count": 1
          },
          {
            "key": "Bill Sage",
            "doc_count": 1
          },
          {
            "key": "Brian Dennehy",
            "doc_count": 1
          },
          {
            "key": "Bridget Moynahan",
            "doc_count": 1
          },
          {
            "key": "Cara Seymour",
            "doc_count": 1
          }
        ]
      },
      "genres": {
        "name": "genres",
        "title": "Genres",
        "position": 3,
        "buckets": [
          {
            "key": "Drama",
            "doc_count": 5
          },
          {
            "key": "Crime",
            "doc_count": 2
          },
          {
            "key": "Thriller",
            "doc_count": 2
          },
          {
            "key": "Action",
            "doc_count": 1
          },
          {
            "key": "Adventure",
            "doc_count": 1
          },
          {
            "key": "Comedy",
            "doc_count": 1
          },
          {
            "key": "Music",
            "doc_count": 1
          },
          {
            "key": "Romance",
            "doc_count": 1
          },
          {
            "key": "Sci-Fi",
            "doc_count": 1
          }
        ]
      }
    }
  }
}
```



## Credit

- [Lunr.js](https://github.com/olivernn/lunr.js) for providing full text search.

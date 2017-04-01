# ItemsJS - search engine in javascript 

Work in progress.. Current version unstable.

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
npm install itemsjs request
```

```js
const request = require('request');
const data_url = 'https://raw.githubusercontent.com/itemsapi/itemsapi-example-data/master/items/movies-processed.json';

console.log('Importing JSON data..');
request(data_url, {json: true}, (err, res) => {
  console.log('Imported data.');
  //console.log(res.body);

  // indexing engine with data..
  var itemsjs = require('./src/index')(res.body);
  // making search..
  var result = itemsjs.search({
    per_page: 1,
    filters: {
      tags: ['dramat']
    }
  })
  console.log(JSON.stringify(result, null, 2));
})
```

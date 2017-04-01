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
const itemsjs = require('itemsjs')(data, configuration);
const items = itemsjs.search(input);
```


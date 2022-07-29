# MiniSearch integration

```js
const MiniSearch = require('minisearch');
const ItemsJS = require('itemsjs');

const data = [{
  id: 1,
  title: 'Moby Dick',
  text: 'Call me Ishmael. Some years ago...',
  category: 'fiction'
},
{
  id: 2,
  title: 'Zen and the Art of Motorcycle Maintenance',
  text: 'I can see by my watch...',
  category: 'fiction'
},
{
  id: 3,
  title: 'Neuromancer',
  text: 'The sky above the port was...',
  category: 'fiction'
},
{
  id: 4,
  title: 'Zen and the Art of Archery',
  text: 'At first sight it must seem...',
  category: 'non-fiction'
}];

// minisearch full text instance
let miniSearch = new MiniSearch({
  fields: ['title', 'text', 'category'],
});

// indexing documents into minisearch
miniSearch.addAll(data);

// configuration for itemsjs faceted search
const configuration = {
  native_search_enabled: false,
  custom_id_field: 'id', // 'id' is a default one but we can also use 'uuid' and other if necessary
  aggregations: {
    category: {
      title: 'Categories',
      size: 10,
      conjunction: true
    }
  }
}

// indexing data into itemsjs
const itemsjs = ItemsJS(data, configuration);



// full text search 
const search_results = miniSearch.search('sky')

const result = itemsjs.search({
  per_page: 3,
  // important! providing ids from full text search
  ids: search_results.map(v => v.id),
  filters: {
    category: ['fiction'],
  }
});

console.log(result);
```

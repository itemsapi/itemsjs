const MiniSearch = require('minisearch')
const ItemsJS = require('./../index');

const documents = [{
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
  }
];

let miniSearch = new MiniSearch({
  fields: ['title', 'text'],
  storeFields: ['title', 'category']
});

// Index all documents
miniSearch.addAll(documents);

const itemsjs = require('./../index')(documents, {
  aggregations: {
    category: {}
  }
});

// Search with default options
let results = miniSearch.search('zen art motorcycle')

console.log(results);

const ids = results.map(v => v.id);
console.log(ids);


const result = itemsjs.search({
  ids: ids
})

console.log(result);

# Custom fulltext search

## MiniSearch

```js
let miniSearch = new MiniSearch({
  fields: ['title', 'text'], // fields to index for full-text search
  storeFields: ['title', 'category'] // fields to return with search results
})

// Index all documents
miniSearch.addAll(documents)

// Search with default options
let results = miniSearch.search('zen art motorcycle')
// => [
//   { id: 2, title: 'Zen and the Art of Motorcycle Maintenance', category: 'fiction', score: 2.77258, match: { ... } },
//   { id: 4, title: 'Zen and the Art of Archery', category: 'non-fiction', score: 1.38629, match: { ... } }
// ]

```

# Contribution

Bower requires adding tags to have package up to date:

```bash
npm run browserify
git tag -a v1.0.16  -m "Release 1.0.16"
git push origin master --tags
npm publish
```

## New lodash function

```bash
# add a new function here and compile
lodash include=some,forEach,map,mapKeys,mapValues,every,includes,intersection,filter,keys,clone,flatten,transform,sortBy -o lib/lodash.js -p
```



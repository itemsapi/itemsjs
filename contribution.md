# Contribution

Bower requires adding tags to have package up to date:

```bash
git tag -a v1.0.6  -m "Release 1.0.6"
git push origin master --tags

npm run browserify
git tag -a v1.0.7  -m "Release 1.0.7" && git push origin master --tags 
npm publish
```

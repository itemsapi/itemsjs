module.exports = {
  type: 'web-module',
  babel: {
    plugins: ['lodash'],
  },
  npm: {
    esModules: true,
    umd: {
      global: 'itemsjs',
      entry: './src/index.js',
      externals: {}
    }
  }
}
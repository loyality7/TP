const path = require('path');

module.exports = {
  // ... other config
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    fallback: {
      "fs": false
    }
  },
  ignoreWarnings: [/Failed to parse source map/],
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [/node_modules\/face-api.js/]
      },
      // ... other rules ...
    ]
  }
};
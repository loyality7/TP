const path = require('path');

module.exports = {
  // ... other config
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}; 
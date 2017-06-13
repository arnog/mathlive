var path = require('path');

module.exports = {
  entry: './js/math.js',
  output: {
    filename: 'mathlivebundle.js',
    path: path.resolve(__dirname, '../dist'),
    library: 'MathLive'
  },
  resolve: {
    modules: ["js"]
  }
};

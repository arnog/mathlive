const path = require('path');

module.exports = {
  entry: './src/mathlive.js',
  output: {
    filename: 'mathlivebundle.js',
    path: path.resolve(__dirname, '../dist'),
    library: 'MathLive'
  },
  resolve: {
    modules: ["js"]
  },
  rules: [
    {
      test: /\.js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['env'],
          // plugins: [require('babel-plugin-transform-object-rest-spread')]
        }
      }
    }
  ]

};

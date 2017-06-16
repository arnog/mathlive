const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, "src/mathlive.js"),
  output: {
    filename: 'mathlive.js',
    path: path.resolve(__dirname, "dist"),
    library: 'MathLive'
  },
  resolve: {
    alias: {
      "mathlive/core": path.resolve(__dirname, "src/core"),
      "mathlive/editor": path.resolve(__dirname, "src/editor"),
      "mathlive/addons": path.resolve(__dirname, "src/addons"),
    }
  },
  module: {
    loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.optimize.UglifyJsPlugin({
      "screw-ie8": true,
      compress: {
        booleans: true,
        cascade: true,
        comparisons: true,
        conditionals: true,
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
        loops: true,
        pure_getters: true,
        sequences: true,
        unsafe: true,
        unused: true,
        warnings: false
      },
      output: {
        comments: false,
      },
    }),
    new CopyWebpackPlugin([
      { from: 'build' },
      { from: 'css/fonts', to: 'fonts' }
    ])
  ]
};

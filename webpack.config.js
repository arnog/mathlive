const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
/*
  // @todo: support multiple versions of the lib, one
  // that can only render equations, the other that includes the editor
  // Consider using the CommonsChunkPlugin...
  entry: {
    "mathlive-core": 'src/mathlive-core.js',  // render only
    "mathlive-core+editor": './mathlive.js'
  },
  output: {
    filename: '[name].js', // Template based on keys in entry above
    path: 'dist'
  }
*/

  entry:   path.resolve(__dirname, "src/mathlive.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'mathlive.js',
    library: 'MathLive',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  resolve: {
    alias: {
      "mathlive/core": path.resolve(__dirname, "src/core"),
      "mathlive/editor": path.resolve(__dirname, "src/editor"),
      "mathlive/addons": path.resolve(__dirname, "src/addons"),
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
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
    })
    ,
    new CopyWebpackPlugin([
      { from: 'css/fonts', to: 'fonts' }
    ])
  ]
};
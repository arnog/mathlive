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
  mode: "production",
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
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
          }
        }
      }
    ]
  },
  optimization: {
    minimize: true,
    runtimeChunk: true,
    splitChunks: {
        chunks: "async",
        minSize: 1000,
        minChunks: 2,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        name: true,
        cacheGroups: {
            default: {
                minChunks: 1,
                priority: -20,
                reuseExistingChunk: true,
            },
            vendors: {
                test: /[\\/]node_modules[\\/]/,
                priority: -10
            }
        }
    }
},
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new CopyWebpackPlugin([
      { from: 'css/fonts', to: 'fonts' }
    ])
  ]
};

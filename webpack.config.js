const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, "src/mathlive.js"),
  output: {
    filename: 'mathlive.js',
    path: path.resolve(__dirname, "dist"),
    library: 'MathLive'
  },
  resolve: {
    modules: [path.resolve(__dirname, "core"), "editor"]
  }
};

var webpack = require('webpack');

module.exports = {
  target: "node",
  entry: {
    main: "./main.js",
    diff: "./diff-parser.js",
  },
  output: {
    filename: "[name].bundle.js"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        presets: ["es2015"]
      }
    }]
  },
}

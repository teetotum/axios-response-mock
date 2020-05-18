const path = require('path');
//const package = require('./package.json');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'axios-response-mock.js',
    library: 'axiosResponseMock',
    libraryTarget: 'umd',
  },
  externals: ['axios', 'is-subset', 'lodash/isEqual'],
  //externals: Object.keys(package.dependencies),
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }],
  },
};

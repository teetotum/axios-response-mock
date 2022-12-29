const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'axios-response-mock.js',
    globalObject: 'this',
    clean: true,
    library: {
      name: 'axiosResponseMock',
      type: 'umd',
    },
  },
  externals: ['axios', 'is-subset', 'lodash', /^lodash\/.+$/],
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' }],
  },
};

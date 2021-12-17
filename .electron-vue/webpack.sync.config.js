const path = require('path')
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: path.resolve(__dirname, '../src/sync/index.ts'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '../dist/sync')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts','.js'],
  },
  externals: {
    "tiny-glob": "require('tiny-glob')",
    "sqlite3": "require('sqlite3')"
  },
  target: 'electron-renderer',
  plugins: [
    new Dotenv()
  ]
}

const path = require('path')
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: path.resolve(__dirname, '../src/backup-process/index.js'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '../dist/backup-process')
  },
  target: 'electron-renderer',
  externals: {
    "archiver": "require('archiver')"   
  },
  plugins: [
    new Dotenv()
  ]
}

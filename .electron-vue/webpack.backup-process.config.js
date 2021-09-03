const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, '../src/backup-process/index.js'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '../dist/backup-process')
  }
}

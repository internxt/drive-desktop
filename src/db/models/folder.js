var Sequelize = require('sequelize')
var sequelize = require('../sequelize')

var folder = sequelize.define(
  'folder', {
    id: { type: Sequelize.INTEGER, unique: true },
    parentId: Sequelize.INTEGER,
    bucketId: Sequelize.STRING,
    name: Sequelize.STRING,
    localPath: Sequelize.STRING
  }, {
    underscored: true
  })

module.exports = folder

var Sequelize = require('sequelize')
var sequelize = require('../sequelize')

var file = sequelize.define(
  'file', {
    fileId: { type: Sequelize.INTEGER, unique: true },
    folderId: Sequelize.INTEGER,

    bucketEntryId: Sequelize.STRING,
    bucketId: Sequelize.STRING,

    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,

    name: Sequelize.STRING,
    hash: Sequelize.STRING,
    size: Sequelize.INTEGER,
    localPath: Sequelize.STRING,
    type: Sequelize.STRING
  }, {
    underscored: true
  })

module.exports = file

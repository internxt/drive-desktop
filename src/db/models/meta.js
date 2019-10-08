var Sequelize = require('sequelize')
var sequelize = require('../sequelize')

var meta = sequelize.define(
  'meta', {
    id: { type: Sequelize.INTEGER, primaryKey: true },
    key: { type: Sequelize.STRING, unique: true },
    value: Sequelize.STRING
  }, {
    underscored: true
  })

module.exports = meta

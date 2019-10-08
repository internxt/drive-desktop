var Sequelize = require('sequelize')
var sequelize = new Sequelize('database', null, null, {
  dialect: 'sqlite',
  storage: 'db/database.db',
  logging: false
})
module.exports = sequelize

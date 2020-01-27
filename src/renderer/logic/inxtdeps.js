'use strict'

const OS = process.platform

let dependency

try {
  if (OS === 'win32') {
    throw Error(OS)
  }
  dependency = require('storj')
} catch (e) {
  dependency = require('node-lib-exec')
}

module.exports = dependency

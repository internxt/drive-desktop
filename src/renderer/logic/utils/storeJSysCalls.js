'use strict'
import Database from '../../database/index'

const Environment = require('storj')

async function _getStorjCredentials() {
  const mnemonic = await Database.Get('xMnemonic')
  const userInfo = (await Database.Get('xUser')).user

  const options = {
    bridgeUrl: 'https://api.internxt.com',
    bridgeUser: userInfo.email,
    bridgePass: userInfo.userId,
    encryptionKey: mnemonic
  }

  return options
}

function getEnvironment() {
  return new Promise(async (resolve, reject) => {
    const options = await _getStorjCredentials()
    const storj = new Environment(options)
    resolve(storj)
  })
}

module.exports = getEnvironment

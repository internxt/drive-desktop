'use strict'
import Database from '../../../database'
import ConfigStore from '../../../main/config-store'

const { Environment } = require('storj')

async function _getStorjCredentials() {
  const mnemonic = await Database.Get('xMnemonic')
  const userInfo = (await Database.Get('xUser')).user
  ConfigStore.set('user.email', userInfo.email)
  ConfigStore.set('user.uuid', userInfo.uuid)

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
    try {
      const options = await _getStorjCredentials()
      const storj = new Environment(options)
      resolve(storj)
    } catch (err) {
      console.error('get environment error', err)
      reject(err)
    }
  })
}

export default getEnvironment

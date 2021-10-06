import database from '../../../database/index'
import packageJson from '../../../../package.json'
import ConfigStore from '../../../main/config-store'

async function getUserEmail() {
  const userData = await database.Get('xUser')
  try {
    return userData.user.email
  } catch (err) {
    return null
  }
}

async function getAuthHeader(withMnemonic) {
  const userData = await database.Get('xUser')
  const header = {
    Authorization: `Bearer ${userData.token}`,
    'content-type': 'application/json; charset=utf-8',
    'internxt-client': 'drive-desktop',
    'internxt-version': packageJson.version
  }
  if (withMnemonic === true) {
    const mnemonic = await database.Get('xMnemonic')
    header['internxt-mnemonic'] = mnemonic
  }
  return header
}

async function denormalizeAuthInfoInConfigStore() {
  ConfigStore.set('authHeaders', await getAuthHeader())
  ConfigStore.set('userData', (await database.Get('xUser')).user)
  ConfigStore.set('mnemonic', await database.Get('xMnemonic'))
}

export default {
  getAuthHeader,
  getUserEmail,
  denormalizeAuthInfoInConfigStore
}

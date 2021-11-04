import ConfigStore from './config-store'
import packageConfig from '../../package.json'

export function setCredentials(userData, mnemonic, bearerToken) {
  ConfigStore.set('mnemonic', mnemonic)
  ConfigStore.set('userData', userData)
  ConfigStore.set('bearerToken', bearerToken)
}

export function getHeaders(withMnemonic = false) {
  const token = ConfigStore.get('bearerToken')
  const header = {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json; charset=utf-8',
    'internxt-client': 'drive-desktop',
    'internxt-version': packageConfig.version,
    'internxt-mnemonic': withMnemonic ? ConfigStore.get('mnemonic') : undefined
  }

  return header
}

export function getUser() {
  const user = ConfigStore.get('userData')
  return Object.keys(user).length ? user : null
}

export function resetCredentials() {
  ConfigStore.delete('mnemonic')
  ConfigStore.delete('userData')
  ConfigStore.delete('bearerToken')
}

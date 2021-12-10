import ConfigStore from './config-store'
import packageConfig from '../../package.json'
import { ipcRenderer } from 'electron'
const app =
  process.type === 'renderer'
    ? require('@electron/remote').app
    : require('electron').app

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

export function getToken() {
  return ConfigStore.get('bearerToken')
}

export function resetCredentials() {
  ConfigStore.delete('mnemonic')
  ConfigStore.delete('userData')
  ConfigStore.delete('bearerToken')
}

export function logout() {
  ipcRenderer.send('stop-backup-process')
  ipcRenderer.send('stop-sync-process')
  app.emit('user-logout')
  saveConfig()
  resetConfig()
  resetCredentials()
}

export function canHisConfigBeRestored(userId) {
  const savedConfigs = ConfigStore.get('savedConfigs')

  const savedConfig = savedConfigs[userId]

  if (!savedConfig) return false

  const {
    backupsEnabled,
    backupInterval,
    lastBackup,
    syncRoot,
    lastSavedListing,
    lastSync
  } = savedConfig

  ConfigStore.set('backupsEnabled', backupsEnabled)
  ConfigStore.set('backupInterval', backupInterval)
  ConfigStore.set('lastBackup', lastBackup)
  ConfigStore.set('syncRoot', syncRoot)
  ConfigStore.set('lastSavedListing', lastSavedListing)
  ConfigStore.set('lastSync', lastSync)

  return true
}

function saveConfig() {
  const { uuid } = getUser()

  const savedConfigs = ConfigStore.get('savedConfigs')

  const backupsEnabled = ConfigStore.get('backupsEnabled')
  const backupInterval = ConfigStore.get('backupInterval')
  const lastBackup = ConfigStore.get('lastBackup')
  const syncRoot = ConfigStore.get('syncRoot')
  const lastSavedListing = ConfigStore.get('lastSavedListing')
  const lastSync = ConfigStore.get('lastSync')

  ConfigStore.set('savedConfigs', {
    ...savedConfigs,
    [uuid]: {
      backupsEnabled,
      backupInterval,
      lastBackup,
      syncRoot,
      lastSavedListing,
      lastSync
    }
  })
}

function resetConfig() {
  ConfigStore.set('backupsEnabled', false)
  ConfigStore.set('backupInterval', 24 * 3600 * 1000)
  ConfigStore.set('lastBackup', -1)
  ConfigStore.set('syncRoot', '')
  ConfigStore.set('lastSavedListing', '')
  ConfigStore.set('lastSync', -1)
}

import Store from 'electron-store'
/**
 * Global user config file
 */

const schema = {
  limit: {
    type: 'number',
    default: -1
  },
  usage: {
    type: 'number',
    default: -1
  },
  autoLaunch: {
    type: 'boolean',
    default: true
  },
  version: {
    type: 'string',
    default: '1.3.0'
  },
  bearerToken: {
    type: 'string',
    default: ''
  },
  userData: {
    type: 'object',
    default: {}
  },
  mnemonic: {
    type: 'string',
    default: ''
  },
  backupsEnabled: {
    type: 'boolean',
    default: false
  },
  backupInterval: {
    type: 'number',
    default: 24 * 3600 * 1000
  },
  lastBackup: {
    type: 'number',
    default: -1
  },
  askBeforeDisablingBackup: {
    type: 'boolean',
    default: true
  }
}

const ConfigStore = new Store({ schema })

export default ConfigStore

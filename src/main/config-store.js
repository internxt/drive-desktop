import Store from 'electron-store'
/**
 * Global user config file
 */

const schema = {
  uploadOnly: {
    type: 'boolean',
    default: false
  },
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
  isSyncing: {
    type: 'boolean',
    default: false
  },
  stopSync: {
    type: 'boolean',
    default: false
  },
  updatingDB: {
    type: 'boolean',
    default: false
  },
  forceUpload: {
    type: 'number',
    default: -1
  },
  resetAll: {
    type: 'boolean',
    default: true
  }
}

const ConfigStore = new Store({ schema: schema })

export default ConfigStore

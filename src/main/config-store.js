import Store from 'electron-store'
/**
 * Global user config file
 */

const schema = {
  syncMode: {
    type: 'string',
    default: 'two-way'
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
  }
}

const ConfigStore = new Store({ schema: schema })

export default ConfigStore

import Store from 'electron-store'

/**
 * Global user config file
 */

const schema = {
  syncMode: {
    type: 'string',
    default: 'two-way'
  }
}

const ConfigStore = new Store({ schema: schema })

export default ConfigStore

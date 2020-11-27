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
  user: {
    email: {
      type: 'string'
    },
    uuid: {
      type: 'string'
    }
  }

}

const ConfigStore = new Store({ schema: schema })

export default ConfigStore

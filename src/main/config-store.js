import Store from 'electron-store'
import uuid4 from 'uuid4'

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
    },
    annonymousID: {
      type: 'string',
      default: uuid4()
    }
  }

}

const ConfigStore = new Store({ schema: schema })

export default ConfigStore

import ConfigStore from '../../../main/config-store'
const Analytics = require('analytics-node')
const client = new Analytics(process.env.APP_SEGMENT_KEY)

const user = {
  userData: {
    email: undefined,
    uuid: undefined
  },
  inicialized: false,
  getSyncMode: function () {
    return ConfigStore.get('syncMode')
  },
  setUser: function (data) {
    this.userData.email = data.email
    this.userData.uuid = data.uuid
    this.inicialized = true
  },
  getUser: function () {
    return this.userData
  },
  getStorage: function () {
    return ConfigStore.get('usage')
  },
  resetData: function () {
    this.userData.email = undefined
    this.userData.uuid = undefined
    this.inicialized = false
  }
}

export { client, user }

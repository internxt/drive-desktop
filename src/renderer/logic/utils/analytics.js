import Logger from '../../../libs/logger'
import ConfigStore from '../../../main/config-store'
import database from '../../../database'
import PackageJson from '../../../../package.json'
import uuid4 from 'uuid4'
const Analytics = require('analytics-node')

const anonymousId = uuid4()
const segmentAnalytics = new Analytics(process.env.APP_SEGMENT_KEY, {
  flushAt: 1
})

const analytics = {
  userData: {
    userMail: undefined,
    uuid: undefined
  },
  track: async function(object) {
    if (!object.anonymousId) {
      if (!this.userData.uuid) {
        const user = await database.Get('xUser')
        if (!user || !user.user.email || !user.user.uuid) {
          return Logger.error('xUser is no initialized')
        }
        this.userData.userMail = user.user.email
        this.userData.uuid = user.user.uuid
      }
      object.userId = this.userData.uuid
      if (this.userData.userMail && object.properties.email) {
        object.properties.email = this.userData.userMail
      }
    }
    object.properties.platform = 'desktop'
    object.properties.version = PackageJson.version

    segmentAnalytics.track(object)
  },

  resetUser: function() {
    this.userData.userMail = undefined
    this.userData.uuid = undefined
  }
}

const context = {
  version: PackageJson.version
}

export function trackSignin() {
  const analytics = new Analytics(process.env.APP_SEGMENT_KEY, {
    flushAt: 1
  })

  const { uuid, email } = ConfigStore.get('userData')

  analytics.identify({
    userId: uuid,
    traits: {
      email
    }
  })
  analytics.track({
    userId: uuid,
    event: 'User Signin',
    context
  })
}

export function trackSigninAttempted(properties) {
  const analytics = new Analytics(process.env.APP_SEGMENT_KEY, {
    flushAt: 1
  })
  analytics.track({
    anonymousId,
    event: 'User Signin Attempted',
    properties,
    context
  })
}

export default analytics

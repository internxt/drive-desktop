import Logger from '../../../libs/logger'
import ConfigStore from '../../../main/config-store'
import database from '../../../database'
import PackageJson from '../../../../package.json'
import uuid4 from 'uuid4'
const Analytics = require('analytics-node')
const analyticsKey = process.env.NODE_ENV !== 'production' ? process.env.APP_SEGMENT_KEY_TEST : process.env.APP_SEGMENT_KEY
const analytics = new Analytics(analyticsKey, {
  flushAt: 1
})
const anonymousId = uuid4()

const context = {
  version: PackageJson.version
}

export function trackBackupStarted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analytics.track({
    userId: uuid,
    event: 'Backup Started',
    properties,
    context
  })
}

export function trackBackupCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analytics.track({
    userId: uuid,
    event: 'Backup Completed',
    properties,
    context
  })
}

export function trackBackupError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analytics.track({
    userId: uuid,
    event: 'Backup Error',
    properties,
    context
  })
}

export function trackSignin() {
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
  analytics.track({
    anonymousId,
    event: 'User Signin Attempted',
    properties,
    context
  })
}

export function trackDownloadError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analytics.track({
    userId: uuid,
    event: 'Download Error',
    properties,
    context
  })
}

export function trackUploadError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analytics.track({
    userId: uuid,
    event: 'Upload Error',
    properties,
    context
  })
}

export function trackUploadStarted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analytics.track({
    userId: uuid,
    event: 'Upload Started',
    properties,
    context
  })
}

export function trackDownloadStarted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analytics.track({
    userId: uuid,
    event: 'Download Started',
    properties,
    context
  })
}

export function trackUploadCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analytics.track({
    userId: uuid,
    event: 'Upload Completed',
    properties,
    context
  })
}

export function trackDownloadCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analytics.track({
    userId: uuid,
    event: 'Download Completed',
    properties,
    context
  })
}

export function trackSignOut() {
  const { uuid } = ConfigStore.get('userData')

  analytics.track({
    userId: uuid,
    event: 'User Signout',
    context
  })
}

export default analytics

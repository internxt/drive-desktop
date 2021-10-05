import ConfigStore from '../../../main/config-store'
import PackageJson from '../../../../package.json'
import { v4 as uuidv4 } from 'uuid'
const Analytics = require('analytics-node')
const analyticsKey = process.env.NODE_ENV !== 'production' ? process.env.APP_SEGMENT_KEY_TEST : process.env.APP_SEGMENT_KEY
const analyticsSegment = new Analytics(analyticsKey, {
  flushAt: 1
})
const anonymousId = uuidv4()

const context = {
  version: PackageJson.version
}

function trackBackupStarted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsSegment.track({
    userId: uuid,
    event: 'Backup Started',
    properties,
    context
  })
}

function trackBackupCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsSegment.track({
    userId: uuid,
    event: 'Backup Completed',
    properties,
    context
  })
}

function trackBackupError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsSegment.track({
    userId: uuid,
    event: 'Backup Error',
    properties,
    context
  })
}

function trackSignin() {
  const { uuid, email } = ConfigStore.get('userData')

  analyticsSegment.identify({
    userId: uuid,
    traits: {
      email
    }
  })
  analyticsSegment.track({
    userId: uuid,
    event: 'User Signin',
    context
  })
}

function trackSigninAttempted(properties) {
  analyticsSegment.track({
    anonymousId,
    event: 'User Signin Attempted',
    properties,
    context
  })
}

function trackDownloadError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsSegment.track({
    userId: uuid,
    event: 'Download Error',
    properties,
    context
  })
}

function trackUploadError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsSegment.track({
    userId: uuid,
    event: 'Upload Error',
    properties,
    context
  })
}

function trackUploadStarted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsSegment.track({
    userId: uuid,
    event: 'Upload Started',
    properties,
    context
  })
}

function trackDownloadStarted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsSegment.track({
    userId: uuid,
    event: 'Download Started',
    properties,
    context
  })
}

function trackUploadCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsSegment.track({
    userId: uuid,
    event: 'Upload Completed',
    properties,
    context
  })
}

function trackDownloadCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsSegment.track({
    userId: uuid,
    event: 'Download Completed',
    properties,
    context
  })
}

function trackSignOut() {
  const { uuid } = ConfigStore.get('userData')

  analyticsSegment.track({
    userId: uuid,
    event: 'User Signout',
    context
  })
}

const analytics = {
  trackSignOut,
  trackBackupStarted,
  trackDownloadCompleted,
  trackUploadCompleted,
  trackDownloadStarted,
  trackUploadStarted,
  trackUploadError,
  trackSignin,
  trackDownloadError,
  trackSigninAttempted,
  trackBackupError,
  trackBackupCompleted
}
export default analytics

import ConfigStore from '../../../main/config-store'
import PackageJson from '../../../../package.json'
import { v4 as uuidv4 } from 'uuid'
const Analytics = require('analytics-node')
const analyticsKey = process.env.NODE_ENV !== 'production' ? process.env.APP_SEGMENT_KEY_TEST : process.env.APP_SEGMENT_KEY
const analyticsLibrary = new Analytics(analyticsKey, {
  flushAt: 1
})
const anonymousId = uuidv4()

const context = {
  version: PackageJson.version
}

function trackBackupStarted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Backup Started',
    properties,
    context
  })
}

function trackBackupCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Backup Completed',
    properties,
    context
  })
}

function trackBackupError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Backup Error',
    properties,
    context
  })
}

function trackSignin() {
  const { uuid, email } = ConfigStore.get('userData')

  analyticsLibrary.identify({
    userId: uuid,
    traits: {
      email
    },
    context
  })
  analyticsLibrary.track({
    userId: uuid,
    event: 'User Signin',
    context
  })
}

function trackSigninAttempted(properties) {
  analyticsLibrary.track({
    anonymousId,
    event: 'User Signin Attempted',
    properties,
    context
  })
}

function trackDownloadError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Download Error',
    properties,
    context
  })
}

function trackBackupsEnabled() {
  const { uuid } = ConfigStore.get('userData')
  const backupsActivation = ConfigStore.get('backupsEnabled')
  analyticsLibrary.identify({
    userId: uuid,
    traits: {
      backups_activated: backupsActivation
    },
    context
  })
}

function trackUploadError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Upload Error',
    properties,
    context
  })
}

function trackUploadStarted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsLibrary.track({
    userId: uuid,
    event: 'Upload Started',
    properties,
    context
  })
}

function trackDownloadStarted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsLibrary.track({
    userId: uuid,
    event: 'Download Started',
    properties,
    context
  })
}

function trackUploadCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsLibrary.track({
    userId: uuid,
    event: 'Upload Completed',
    properties,
    context
  })
}

function trackDownloadCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')

  analyticsLibrary.track({
    userId: uuid,
    event: 'Download Completed',
    properties,
    context
  })
}

function trackSignOut() {
  const { uuid } = ConfigStore.get('userData')

  analyticsLibrary.track({
    userId: uuid,
    event: 'User Signout',
    context
  })
}

function trackUpgradeButton() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Upgrade Clicked',
    context
  })
}

function trackBackupInterval() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.identify({
    userId: uuid,
    traits: {
      backup_interval: ConfigStore.get('backupInterval')
    }
  })
}

function trackDeviceName(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Device Name Added',
    properties,
    context
  })
}

function trackUsageAndLimit(traits) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.identify({
    userId: uuid,
    traits,
    context
  })
}

function trackLinkToDriveBackups() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Backups Web Redirected',
    context
  })
}

function trackStartInternxtOnStartup(traits) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.identify({
    userId: uuid,
    traits,
    context
  })
}

function trackBlockedDevice() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Device Blocked',
    context
  })
}

function trackSyncStarted() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Sync Started',
    context
  })
}

function trackSyncStoped() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Sync Stoped',
    context
  })
}

function trackLogOut(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'User Log Out',
    properties,
    context
  })
}

function trackQuit() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'User Quit',
    context
  })
}

function trackSyncCompleted(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Sync Completed',
    properties,
    context
  })
}

function trackSyncError(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Sync Error',
    properties,
    context
  })
}

function trackRegisterViaDesktop() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Register Redirected',
    context
  })
}

function trackForgotPassword() {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Password Forgotten',
    context
  })
}

function trackSyncFolderChanged(properties) {
  const { uuid } = ConfigStore.get('userData')
  analyticsLibrary.track({
    userId: uuid,
    event: 'Sync Folder Cheanged',
    properties,
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
  trackBackupCompleted,
  trackBackupsEnabled,
  trackUpgradeButton,
  trackBackupInterval,
  trackDeviceName,
  trackUsageAndLimit,
  trackLinkToDriveBackups,
  trackStartInternxtOnStartup,
  trackBlockedDevice,
  trackSyncStarted,
  trackSyncStoped,
  trackLogOut,
  trackQuit,
  trackSyncCompleted,
  trackSyncError,
  trackForgotPassword,
  trackRegisterViaDesktop,
  trackSyncFolderChanged
}
export default analytics

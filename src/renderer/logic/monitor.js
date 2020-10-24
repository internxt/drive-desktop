import Sync from './sync'
import async from 'async'
import Downloader from './downloader'
import Uploader from './uploader'
import Tree from './tree'
import database from '../../database'
import electron from 'electron'
import watcher from './watcher'
import Logger from '../../libs/logger'
import fs from 'fs'
import path from 'path'
import sanitize from 'sanitize-filename'
import PackageJson from '../../../package.json'
import OneWayUpload from './sync/OneWayUpload'
import Folder from './folder'
import File from './file'
import ConfigStore from '../../main/config-store'
import DeviceLock from './devicelock'
import TwoWaySync from './sync/TwoWaySync'

let wtc, timeoutInstance
let isSyncing = false
const lastSyncFailed = false

const { app, powerMonitor } = electron.remote
let updateSyncInterval

powerMonitor.on('suspend', () => {
  Logger.warn('System suspended')
  clearTimeout(timeoutInstance)
  DeviceLock.StopUpdateDeviceSync()
})

powerMonitor.on('resume', () => {
  Logger.warn('System suspended')
  clearTimeout(timeoutInstance)
  Monitor()
})

app.on('open-folder', function () {
  database.Get('xPath').then(xPath => {
    if (fs.existsSync(xPath)) {
      electron.shell.openItem(xPath)
    } else {
      Logger.log('Error opening root folder from try icon')
    }
  }).catch(() => {
    Logger.log('Error opening root folder from try icon')
  })
})

app.on('sync-start', function () {
  if (!isSyncing) {
    Logger.log('Sync request by user')
    Monitor(true)
  } else {
    Logger.warn('There is an active sync running right now')
  }
})

function Monitor(startImmediately = false) {
  let timeout = 0
  if (!startImmediately) {
    isSyncing = false
    timeout = 1000 * 60 * 10
  }
  if (!startImmediately && process.env.NODE_ENV !== 'production') {
    timeout = 1000 * 30
  }
  if (!isSyncing) {
    clearTimeout(timeoutInstance)
    Logger.log('Waiting %s secs for next sync. Version: v%s', timeout / 1000, PackageJson.version)
    timeoutInstance = setTimeout(() => InitMonitor(), timeout)
  }
}

async function InitMonitor() {
  // Init database if not initialized
  database.InitDatabase()

  const syncMode = ConfigStore.get('syncMode')

  if (syncMode === 'two-way') {
    TwoWaySync.Start()
  } else {
    OneWayUpload.Start()
  }
}

Monitor.prototype.StopMonitor = () => {
  clearTimeout(timeoutInstance)
}

export default {
  Monitor,
  MonitorStart: () => Monitor(true)
}

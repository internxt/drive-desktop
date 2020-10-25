import database from '../../database'
import electron from 'electron'
import Logger from '../../libs/logger'
import fs from 'fs'
import OneWayUpload from './sync/OneWayUpload'
import ConfigStore from '../../main/config-store'
import DeviceLock from './devicelock'
import TwoWaySync from './sync/TwoWaySync'

let timeoutInstance
let isSyncing = false

const { app, powerMonitor } = electron.remote

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
  InitMonitor(startImmediately)
}

async function InitMonitor(startImmediately = false) {
  // Init database if not initialized
  database.InitDatabase()

  const syncMode = ConfigStore.get('syncMode')

  isSyncing = true
  if (syncMode === 'two-way') {
    TwoWaySync.Start(startImmediately)
  } else {
    OneWayUpload.Start(startImmediately)
  }
}

Monitor.prototype.StopMonitor = () => {
  clearTimeout(timeoutInstance)
}

export default {
  Monitor,
  MonitorStart: () => Monitor(true)
}

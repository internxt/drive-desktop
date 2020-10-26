import database from '../../database'
import electron from 'electron'
import Logger from '../../libs/logger'
import fs from 'fs'
import OneWayUpload from './sync/OneWayUpload'
import ConfigStore from '../../main/config-store'
import TwoWaySync from './sync/TwoWaySync'

let timeoutInstance
let isSyncing = false

const { app } = electron.remote

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
  Monitor(true)
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
    TwoWaySync.start(startImmediately)
  } else {
    OneWayUpload.start(startImmediately)
  }
}

export default {
  Monitor
}

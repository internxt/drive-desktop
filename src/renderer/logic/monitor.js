import database from '../../database'
import electron from 'electron'
import Logger from '../../libs/logger'
import fs from 'fs'
import OneWayUpload from './sync/OneWayUpload'
import ConfigStore from '../../main/config-store'
import TwoWaySync from './sync/TwoWaySync'

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

function repeat() {
  Monitor(true)
}

async function InitMonitor(startImmediately = false) {
  // Init database if not initialized
  database.InitDatabase()

  const syncMode = ConfigStore.get('syncMode')

  if (syncMode === 'two-way') {
    TwoWaySync.start(repeat, startImmediately)
  } else {
    OneWayUpload.start(repeat, startImmediately)
  }
}

export default {
  Monitor
}

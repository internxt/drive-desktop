import async from 'async'
import Logger from '../../../libs/logger'
import watcher from '../watcher'
import electron from 'electron'
import Folder from '../folder'
import database from '../../../database'
import Uploader from '../uploader'
import DeviceLock from '../devicelock'
import Tree from '../tree'
import PackageJson from '../../../../package.json'

/*
 * Sync Method: One Way, from LOCAL to CLOUD (Only Upload)
 */

const { app } = electron.remote

const SYNC_METHOD = 'one-way-upload'
let isSyncing = false
let wtc = null
let lastSyncFailed = false
let timeoutInstance = null

async function SyncLogic(callback) {
  Logger.info('One way upload started')
  const userDevicesSyncing = await DeviceLock.RequestSyncLock()
  if (isSyncing || userDevicesSyncing) {
    if (userDevicesSyncing) {
      Logger.warn('1-way-upload not started: another device already syncing')
      Start()
    }
    return
  }

  app.once('sync-stop', () => {
    isSyncing = false
    app.emit('sync-off')
    throw Error('Monitor stopped')
  })

  isSyncing = true
  lastSyncFailed = false

  async.waterfall(
    [
      next => {
        // Change icon to "syncing"
        app.emit('sync-on')
        Folder.clearTempFolder().then(next).catch(() => next())
      },
      next => {
        Folder.RootFolderExists().then((exists) => {
          next(exists ? null : exists)
        }).catch(next)
      },
      next => {
        // Start the folder watcher if is not already started
        app.emit('set-tooltip', 'Initializing watcher...')
        database.Get('xPath').then(xPath => {
          console.log('User store path: %s', xPath)
          if (!wtc) {
            watcher.StartWatcher(xPath).then(watcherInstance => {
              wtc = watcherInstance
              next()
            })
          } else {
            next()
          }
        }).catch(next)
      },
      next => {
        database.ClearTemp().then(() => next()).catch(next)
      },
      next => {
        // New sync started, so we save the current date
        const now = new Date()
        Logger.log('Sync started at', now.toISOString())
        database.Set('syncStartDate', now).then(() => next()).catch(next)
      },
      next => {
        // Search for new folders in local folder
        // If a folder exists in local, but is not on the remote tree, create in remote
        // If it is the first time you sync, or the last sync failed, creation may throw an error
        // because folder already exists on remote. Ignore this error.
        Uploader.uploadNewFolders().then(() => next()).catch(next)
      },
      next => {
        // Search new files in local folder, and upload them
        Uploader.uploadNewFiles().then(() => next()).catch(next)
      },
      next => {
        // Will determine if something wrong happened in the last synchronization
        database.Get('lastSyncDate').then(lastDate => {
          if (!lastDate || !(lastDate instanceof Date)) {
            // If there were never a last time (first time sync), the success is set to false.
            database.Set('lastSyncSuccess', false).then(() => next()).catch(next)
          } else {
            // If last time is more than 2 days, let's consider a unsuccessful sync,
            // to perform the sync from the start
            const DifferenceInTime = new Date() - lastDate
            const DifferenceInDays = DifferenceInTime / (1000 * 60 * 60 * 24)
            if (DifferenceInDays > 2) {
              // Last sync > 2 days, assume last sync failed to start from 0
              database.Set('lastSyncSuccess', false).then(() => next()).catch(next)
            } else {
              // Sync ok
              next()
            }
          }
        }).catch(next)
      },
      next => {
        // Start to sync. Did last sync failed?
        // Then, clear all the local databases to start from zero
        database.Get('lastSyncSuccess').then(result => {
          if (result === true) {
            next()
          } else {
            lastSyncFailed = true
            Logger.warn('LAST SYNC FAILED, CLEARING DATABASES')
            database.ClearAll().then(() => next()).catch(next)
          }
        }).catch(next)
      },
      next => {
        database.Set('lastSyncSuccess', false).then(() => next()).catch(next)
      },
      next => {
        // backup the last database
        database.BackupCurrentTree().then(() => next()).catch(next)
      },
      next => {
        // Sync and update the remote tree.
        Tree.RegenerateAndCompact().then(() => next()).catch(next)
      },
      next => { database.Set('lastSyncSuccess', true).then(() => next()).catch(next) },
      next => { database.Set('lastSyncDate', new Date()).then(() => next()).catch(next) }
    ],
    async err => {
      // If monitor ended before stopping the watcher, let's ensure

      // Switch "loading" tray ico
      app.emit('set-tooltip')
      app.emit('sync-off')
      DeviceLock.StopUpdateDeviceSync()
      // Sync.UpdateUserSync(true)
      isSyncing = false

      const rootFolderExist = await Folder.RootFolderExists()
      if (!rootFolderExist) {
        await database.ClearAll()
        await database.ClearUser()
        database.CompactAllDatabases()
        return
      }

      if (err) {
        Logger.error('Error monitor:', err)
        async.waterfall([
          next => database.ClearAll().then(() => next()).catch(() => next()),
          next => {
            database.CompactAllDatabases()
            next()
          }
        ], () => {
          Start()
        })
      } else {
        database.ClearAll().then(() => Start()).catch(() => {
          Logger.error('Cannot end up 1-way-upload, fatal error')
        })
      }
    }
  )
}

function Start(startImmediately = false) {
  Logger.info('Start 1-way-upload sync')
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
    Logger.log('Waiting %s secs for next 1-way sync. Version: v%s', timeout / 1000, PackageJson.version)
    timeoutInstance = setTimeout(() => SyncLogic(), timeout)
  }
}

function Stop() {
  clearInterval(timeoutInstance)
}

export default {
  SYNC_METHOD,
  Start,
  Stop
}

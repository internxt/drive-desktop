import Sync from './sync'
import Uploader from './Uploader'
import async from 'async'
import Downloader from './downloader'
import tree from './tree'
import database from '../../database'
import electron from 'electron'
import watcher from './watcher'
import Logger from '../../libs/logger'
import fs from 'fs'
import path from 'path'
import sanitize from 'sanitize-filename'
import PackageJson from '../../../package.json'
import OneWayUpload from './sync/OneWayUpload'
import Folder from './Folder'
import File from './File'

let wtc, timeoutInstance
let isSyncing = false
let lastSyncFailed = false

const { app, powerMonitor } = electron.remote
let updateSyncInterval

powerMonitor.on('suspend', () => {
  Logger.warn('System suspended')
  clearTimeout(timeoutInstance)
  StopUpdateDeviceSync()
})

powerMonitor.on('resume', () => {
  Logger.warn('System suspended')
  clearTimeout(timeoutInstance)
  app.relaunch()
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
    timeout = 1000 * 15
  }
  if (!isSyncing) {
    clearTimeout(timeoutInstance)
    Logger.log('Waiting %s secs for next sync. Version: v%s', timeout / 1000, PackageJson.version)
    timeoutInstance = setTimeout(() => OneWayUpload.Monitor(), timeout)
  }
}

function RootFolderExists() {
  return new Promise((resolve, reject) => {
    database.Get('xPath').then(xPath => {
      if (!xPath) {
        resolve(false)
      }

      resolve(fs.existsSync(xPath))
    }).catch(reject)
  })
}

async function InitMonitor() {
  // Init database if not initialized
  database.InitDatabase()
  StartMonitor()
}

Monitor.prototype.StopMonitor = () => {
  clearTimeout(timeoutInstance)
}

function StartUpdateDeviceSync() {
  Logger.log('Started sync update interval')
  Sync.UpdateUserSync()
  updateSyncInterval = setInterval(() => Sync.UpdateUserSync(), Sync.SYNC_KEEPALIVE_INTERVAL_MS)
}

function StopUpdateDeviceSync() {
  Logger.log('Stopped sync update interval')
  Sync.UnlockSync()
  clearInterval(updateSyncInterval)
}

async function StartMonitor() {
  const userDevicesSyncing = await Sync.GetOrSetUserSync()
  if (isSyncing || userDevicesSyncing) {
    if (userDevicesSyncing) {
      Logger.warn('Sync not started because user have other device syncing')
      Monitor()
    }

    return
  }

  app.on('sync-stop', () => {
    isSyncing = false
    app.emit('sync-off')
    throw Error('Monitor stopped')
  })

  // StartUpdateDeviceSync()
  isSyncing = true
  lastSyncFailed = false

  // Sync
  async.waterfall(
    [
      next => {
        // Change icon to "syncing"
        app.emit('sync-on')
        Folder.clearTempFolder().then(next).catch(() => next())
      },
      next => {
        RootFolderExists().then((exists) => {
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
        Logger.log('Sync started at', now)
        database.Set('syncStartDate', now).then(() => next()).catch(next)
      },
      next => {
        // Search for new folders in local folder
        // If a folder exists in local, but is not on the remote tree, create in remote
        // If is the first time you sync, or the last sync failed, creation may throw an error
        // because folder already exists on remote. Ignore this error.
        UploadNewFolders().then(() => next()).catch(next)
      },
      next => {
        // Search new files in local folder, and upload them
        UploadNewFiles().then(() => next()).catch(next)
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
        // Delete remote folders missing in local folder
        Folder.cleanRemoteWhenLocalDeleted(lastSyncFailed).then(() => next()).catch(next)
      },
      next => {
        // Delete remote files missing in local folder
        File.cleanRemoteWhenLocalDeleted(lastSyncFailed).then(() => next()).catch(next)
      },
      next => {
        // backup the last database
        database.BackupCurrentTree().then(() => next()).catch(next)
      },
      next => {
        // Sync and update the remote tree.
        SyncRegenerateAndCompact().then(() => next()).catch(next)
      },
      next => {
        // Delete local folders missing in remote
        Folder.cleanLocalWhenRemoteDeleted(lastSyncFailed).then(() => next()).catch(next)
      },
      next => {
        // Delete local files missing in remote
        File.cleanLocalWhenRemoteDeleted(lastSyncFailed).then(() => next()).catch(next)
      },
      next => {
        // Create local folders
        // Si hay directorios nuevos en el árbol, los creamos en local
        DownloadFolders().then(() => next()).catch(next)
      },
      next => {
        // Download remote files
        // Si hay ficheros nuevos en el árbol, los creamos en local
        DownloadFiles().then(() => next()).catch(next)
      },
      next => { database.Set('lastSyncSuccess', true).then(() => next()).catch(next) },
      next => { database.Set('lastSyncDate', new Date()).then(() => next()).catch(next) }
    ],
    async err => {
      // If monitor ended before stopping the watcher, let's ensure

      // Switch "loading" tray ico
      app.emit('set-tooltip')
      app.emit('sync-off')
      StopUpdateDeviceSync()
      // Sync.UpdateUserSync(true)
      isSyncing = false

      const rootFolderExist = await RootFolderExists()
      if (!rootFolderExist) {
        await database.ClearFolders()
        await database.ClearFiles()
        await database.ClearTemp()
        await database.ClearLastFiles()
        await database.ClearLastFolders()
        await database.ClearUser()
        await database.CompactAllDatabases()
        return
      }

      if (err) {
        Logger.error('Error monitor:', err)
        async.waterfall([
          next => database.ClearFolders().then(() => next()).catch(() => next()),
          next => database.ClearFiles().then(() => next()).catch(() => next()),
          next => database.ClearTemp().then(() => next()).catch(() => next()),
          next => database.ClearLastFiles().then(() => next()).catch(() => next()),
          next => database.ClearLastFolders().then(() => next()).catch(() => next()),
          next => {
            database.CompactAllDatabases()
            next()
          }
        ], () => {
          Monitor()
        })
      } else {
        Monitor()
      }
    }
  )
}

// Obtain remote tree
function SyncTree() {
  return new Promise((resolve, reject) => {
    Sync.UpdateTree().then(() => { resolve() }).catch(err => {
      Logger.error('Error sync tree', err)
      reject(err)
    })
  })
}

function RegenerateLocalDbFolders() {
  return new Promise((resolve, reject) => {
    tree.GetFolderObjectListFromRemoteTree().then(list => {
      database.dbFolders.remove({}, { multi: true }, (err, n) => {
        if (err) { reject(err) } else {
          async.eachSeries(list,
            (item, next) => {
              if (path.basename(item.key) !== sanitize(path.basename(item.key))) {
                Logger.info('Ignoring folder %s, invalid name', item.key)
                return next()
              }
              database.dbFolders.insert(item, (err, document) => next(err, document))
            },
            err => { if (err) { reject(err) } else { resolve(err) } }
          )
        }
      })
    }).catch(reject)
  })
}

function RegenerateLocalDbFiles() {
  return new Promise((resolve, reject) => {
    tree.GetFileListFromRemoteTree().then(list => {
      database.dbFiles.remove({}, { multi: true }, (err, n) => {
        if (err) { reject(err) } else {
          async.eachSeries(list,
            (item, next) => {
              const finalObject = { key: item.fullpath, value: item }
              if (path.basename(finalObject.key) !== sanitize(path.basename(finalObject.key))) {
                Logger.info('Ignoring file %s, invalid name', finalObject.key)
                return next()
              }
              database.dbFiles.insert(finalObject, (err, document) => next(err, document))
            },
            err => {
              if (err) { reject(err) } else { resolve() }
            }
          )
        }
      })
    }).catch(reject)
  })
}

function SyncRegenerateAndCompact() {
  return new Promise((resolve, reject) => {
    async.waterfall([
      next => SyncTree().then(() => next()).catch(next),
      next => RegenerateLocalDbFolders().then(() => next()).catch(next),
      next => RegenerateLocalDbFiles().then(() => next()).catch(next)
    ], (err) => {
      database.CompactAllDatabases()
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Create all existing remote folders on local path
function DownloadFolders() {
  return new Promise((resolve, reject) => {
    Sync.CreateLocalFolders().then(() => {
      resolve()
    }).catch(err => {
      Logger.error('Error creating local folders', err)
      reject(err)
    })
  })
}

// Download all the files
function DownloadFiles() {
  return new Promise((resolve, reject) => {
    Downloader.DownloadAllFiles().then(() => resolve()).catch(reject)
  })
}

function UploadNewFolders() {
  return new Promise((resolve, reject) => {
    app.emit('set-tooltip', 'Indexing folders...')
    Downloader.UploadAllNewFolders().then(() => resolve()).catch(reject)
  })
}

function UploadNewFiles() {
  return new Promise((resolve, reject) => {
    app.emit('set-tooltip', 'Indexing files...')
    Downloader.UploadAllNewFiles().then(() => resolve()).catch(reject)
  })
}

export default {
  Monitor,
  MonitorStart: () => Monitor(true),
  RootFolderExists
}

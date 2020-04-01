import Sync from './sync'
import async from 'async'
import Downloader from './downloader'
import tree from './tree'
import database from '../../database'
import electron from 'electron'
import watcher from './watcher'
import Logger from '../../libs/logger'
import fs from 'fs'

let wtc, timeoutInstance
let isSyncing = false

const app = electron.remote.app

app.on('sync-start', function () {
  if (!isSyncing) {
    Logger.log('Sync request by user')
    Monitor(true)
  } else {
    Logger.warn('There is an active sync running right now')
  }
})

function Monitor(startInmediately = false) {
  let timeout = 0
  if (!startInmediately) {
    timeout = 1000 * 60 * 10
  }
  if (!startInmediately && process.env.NODE_ENV !== 'production') {
    timeout = 1000 * 15
  }
  if (!isSyncing) {
    clearTimeout(timeoutInstance)
    Logger.log('Waiting %s secs for next sync', timeout / 1000)
    timeoutInstance = setTimeout(() => StartMonitor(), timeout)
  }
}

function RootFolderExists() {
  return new Promise((resolve, reject) => {
    database.Get('xPath').then(xPath => {
      resolve(fs.existsSync(xPath))
    }).catch(reject)
  })
}

function StartMonitor() {
  if (isSyncing) {
    return
  }
  isSyncing = true

  // Sync
  async.waterfall(
    [
      next => {
        RootFolderExists().then((exists) => {
          next(exists ? null : exists)
        }).catch(next)
      },
      next => {
        // Start the folder watcher if is not already started
        database.Get('xPath').then(xPath => {
          if (!wtc) { wtc = watcher.StartWatcher(xPath) }
          next()
        }).catch(next)
      },
      next => {
        database.ClearTemp().then(() => next()).catch(next)
      },
      next => {
        // Change icon to "syncing"
        app.emit('sync-on')
        // New sync started, so we save the current date
        let now = new Date()
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
            var DifferenceInTime = new Date() - lastDate
            var DifferenceInDays = DifferenceInTime / (1000 * 3600 * 24)
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
        // Borrar diretorios remotos que ya no existen en local
        // Nos basamos en el último árbol sincronizado
        CleanLocalFolders().then(() => next()).catch(next)
      },
      next => {
        // Delete remote files missing in local folder
        // Borrar archivos remotos que ya no existen en local
        // Nos basamos en el último árbol sincronizado
        CleanLocalFiles().then(() => next()).catch(next)
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
        CleanRemoteFolders().then(() => next()).catch(next)
      },
      next => {
        // Delete local files missing in remote
        CleanRemoteFiles().then(() => next()).catch(next)
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

      // Switch "loading" tray icon
      app.emit('sync-off')
      isSyncing = false

      const rootFolderExist = await RootFolderExists()
      if (!rootFolderExist) {
        await database.ClearFolders()
        await database.ClearFiles()
        await database.ClearTemp()
        await database.ClearUser()
        await database.CompactAllDatabases()

        return
      }

      if (err) {
        Logger.error('Error monitor:', err)
        async.waterfall([
          next => database.ClearFolders().then(() => next()).catch(next),
          next => database.ClearFiles().then(() => next()).catch(next),
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

// Missing folders with entry in local db
function CleanLocalFolders() {
  return new Promise((resolve, reject) => {
    Sync.CheckMissingFolders().then(resolve).catch(reject)
  })
}

// Missing files with entry in local db
function CleanLocalFiles() {
  return new Promise((resolve, reject) => {
    Sync.CheckMissingFiles().then(resolve).catch(reject)
  })
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
            (item, next) => { database.dbFolders.insert(item, (err, document) => next(err, document)) },
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
              let finalObject = { key: item.fullpath, value: item }
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
    Downloader.UploadAllNewFolders().then(() => resolve()).catch(reject)
  })
}

function UploadNewFiles() {
  return new Promise((resolve, reject) => {
    Downloader.UploadAllNewFiles().then(() => resolve()).catch(reject)
  })
}

function CleanRemoteFolders() {
  return new Promise((resolve, reject) => {
    Sync.CleanLocalFolders().then(() => resolve()).catch(reject)
  })
}

function CleanRemoteFiles() {
  return new Promise((resolve, reject) => {
    Sync.CleanLocalFiles().then(() => resolve()).catch(reject)
  })
}

export default {
  Monitor,
  MonitorStart: () => Monitor(true)
}

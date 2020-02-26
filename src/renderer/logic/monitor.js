import Sync from './sync'
import async from 'async'
import Downloader from './downloader'
import tree from './tree'
import database from '../../database'
import electron from 'electron'
import watcher from './watcher'

let wtc

const app = electron.remote.app

function Monitor(startInmediately = false) {
  let timeout = 0
  if (!startInmediately) {
    timeout = 1000 * 60 * 10
  }
  if (!startInmediately && process.env.NODE_ENV !== 'production') {
    timeout = 1000 * 15
  }
  console.log('Waiting %s secs for next sync', timeout / 1000)
  setTimeout(() => StartMonitor(), timeout)
}

function StartMonitor() {
  // Sync
  async.waterfall(
    [
      next => {
        database.Get('xPath').then(xPath => {
          if (!wtc) { wtc = watcher.StartWatcher(xPath) }
          next()
        }).catch(next)
      },
      next => {
        // New sync started, so we save the current date
        app.emit('sync-on')
        database.Set('syncStartDate', new Date()).then(() => next()).catch(next)
      },
      next => {
        // Search for new folders in local folder
        // It is neccesary to do this before uploading new files
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
            console.log('LAST SYNC FAILED, CLEARING DATABASES')
            async.parallel(
              [
                nextParallel => database.ClearFiles().then(() => nextParallel()).catch(nextParallel),
                nextParallel => database.ClearFolders().then(() => nextParallel()).catch(nextParallel)
              ],
              (err) => next(err))
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
    err => {
      // If monitor ended before stopping the watcher, let's ensure

      // Switch "loading" tray icon
      app.emit('sync-off')

      if (err) {
        database.ClearFolders()
        database.ClearFiles()
        database.CompactAllDatabases()
        Monitor()
        console.error('Error monitor:', err)
      } else {
        Monitor()
      }
    }
  )
}

// Missing folders with entry in local db
function CleanLocalFolders() {
  console.log('Clearing missing folders...')
  return new Promise((resolve, reject) => {
    Sync.CheckMissingFolders().then(resolve).catch(reject)
  })
}

// Missing files with entry in local db
function CleanLocalFiles() {
  console.log('Clearing missing files...')
  return new Promise((resolve, reject) => {
    Sync.CheckMissingFiles().then(resolve).catch(reject)
  })
}

// Obtain remote tree
function SyncTree() {
  console.log('Sync tree of remote files')
  return new Promise((resolve, reject) => {
    Sync.UpdateTree()
      .then(() => {
        console.log('Tree of remote folders/files successfully updated')
        resolve()
      })
      .catch(err => {
        console.error('Error sync tree', err)
        reject(err)
      })
  })
}

function RegenerateLocalDbFolders() {
  return new Promise((resolve, reject) => {
    console.log('Regenerating local folders database')
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
    console.log('Regenerating local files database')
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
  console.log('Downloading folders')
  return new Promise((resolve, reject) => {
    Sync.CreateLocalFolders().then(() => {
      console.log('Local folders created')
      resolve()
    }).catch(err => {
      console.log('Error creating local folders', err)
      reject(err)
    })
  })
}

// Download all the files
function DownloadFiles() {
  console.log('Downloading files')
  return new Promise((resolve, reject) => {
    Downloader.DownloadAllFiles().then(() => resolve()).catch(reject)
  })
}

function UploadNewFolders() {
  // console.log('Creating new folders in remote')
  return new Promise((resolve, reject) => {
    Downloader.UploadAllNewFolders().then(() => resolve()).catch(reject)
  })
}

function UploadNewFiles() {
  // console.log('Uploading local new files')
  return new Promise((resolve, reject) => {
    Downloader.UploadAllNewFiles().then(() => resolve()).catch(reject)
  })
}

function CleanRemoteFolders() {
  console.log('Clear remote folders')
  return new Promise((resolve, reject) => {
    Sync.CleanLocalFolders().then(() => resolve()).catch(reject)
  })
}

function CleanRemoteFiles() {
  console.log('Clear remote files')
  return new Promise((resolve, reject) => {
    Sync.CleanLocalFiles().then(() => resolve()).catch(reject)
  })
}

export default {
  Monitor,
  MonitorStart: () => Monitor(true)
}

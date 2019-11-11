import Sync from './sync'
import async from 'async'
import Downloader from './downloader'
import tree from './tree'
import database from '../../database'

function Monitor (startInmediately = false) {
  let timeout = 0
  if (!startInmediately) { timeout = 60000 }
  console.log('Waiting %s secs for next sync', timeout / 1000)
  setTimeout(() => StartMonitor(), timeout)
}

function StartMonitor () {
  // Sync
  async.waterfall([
    (next) => {
      // Delete remote folders missing in local folder
      CleanLocalFolders().then(() => next(null)).catch(err => next(err))
    },
    (next) => {
      // Delete remote files missing in local folder
      CleanLocalFiles().then(() => next(null)).catch(err => next(err))
    },
    (next) => {
      // Donwload the tree of remote files and folders
      SyncTree().then(() => next()).catch(err => next(err))
    },
    (next) => {
      // Regenerate dbFolders and dbFiles
      RegenerateLocalDbFolders().then(() => next()).catch(err => next(err))
    },
    (next) => {
      // Regenerate dbFolders and dbFiles
      RegenerateLocalDbFiles().then(() => next()).catch(err => next(err))
    },
    (next) => {
      // Create local folders
      DownloadFolders().then(() => next()).catch(err => next(err))
    },
    (next) => {
      // Download remote files
      DownloadFiles().then(() => next()).catch(err => next(err))
    },
    (next) => {
      // Delete local folders missing in remote
      CleanRemoteFolders().then(() => next()).catch(err => next(err))
    },
    (next) => {
      // Delete local files missing in remote
      CleanRemoteFiles().then(() => next()).catch(err => next(err))
    }
  ], (err, result) => {
    if (err) { console.error('Error sync:', err) } else { Monitor() }
  })
}

// Missing folders with entry in local db
function CleanLocalFolders () {
  console.log('Clearing missing folders...')
  return new Promise((resolve, reject) => {
    Sync.CheckMissingFolders().then(() => resolve()).catch(err => reject(err))
  })
}

// Missing files with entry in local db
function CleanLocalFiles () {
  console.log('Clearing missing files...')
  return new Promise((resolve, reject) => {
    Sync.CheckMissingFiles().then(() => resolve()).catch(err => reject(err))
  })
}

// Obtain remote tree
function SyncTree () {
  console.log('Sync tree of remote files')
  return new Promise((resolve, reject) => {
    Sync.UpdateTree().then(() => {
      console.log('Tree of remote folders/files updated')
      resolve()
    }).catch(err => {
      console.log('Error', err)
      reject(err)
    })
  })
}

function RegenerateLocalDbFolders () {
  return new Promise((resolve, reject) => {
    console.log('Regenerating local folders database')
    tree.GetFolderObjectListFromRemoteTree().then(list => {
      database.dbFolders.remove({}, { multi: true }, (err, n) => {
        if (err) { reject(err) } else {
          async.eachSeries(list, (item, next) => {
            database.dbFolders.insert(item, (err, document) => next(err, document))
          }, (err) => {
            if (err) { reject(err) } else { resolve(err) }
          })
        }
      })
    }).catch(err => reject(err))
  })
}

function RegenerateLocalDbFiles () {
  return new Promise((resolve, reject) => {
    console.log('Regenerating local files database')
    tree.GetFileListFromRemoteTree().then(list => {
      database.dbFiles.remove({}, { multi: true }, (err, n) => {
        if (err) { reject(err) } else {
          async.eachSeries(list, (item, next) => {
            let finalObject = {
              key: item.fullpath,
              value: item
            }
            database.dbFiles.insert(finalObject, (err, document) => next(err, document))
          }, (err) => {
            if (err) { reject(err) } else { reject(err) }
          })
        }
      })
    }).catch(err => reject(err))
  })
}

// Create all existing remote folders on local path
function DownloadFolders () {
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
function DownloadFiles () {
  console.log('Downloading files')
  return new Promise((resolve, reject) => {
    Downloader.DownloadAllFiles().then(result => resolve()).catch(err => reject(err))
  })
}

function CleanRemoteFolders () {
  console.log('Clear remote folders')
  return new Promise((resolve, reject) => {
    Sync.CleanLocalFolders().then(() => resolve()).catch(err => reject(err))
  })
}

function CleanRemoteFiles () {
  console.log('Clear remote files')
  return new Promise((resolve, reject) => {
    Sync.CleanLocalFiles().then(() => resolve()).catch(err => reject(err))
  })
}

export default {
  Monitor,
  MonitorStart: () => Monitor(true)
}

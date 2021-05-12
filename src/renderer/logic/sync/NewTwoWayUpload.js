import async from 'async'
import Logger from '../../../libs/logger'
import Folder from '../folder'
import File from '../file'
import database from '../../../database'
import DeviceLock from '../devicelock'
import Tree from '../tree'
import PackageJson from '../../../../package.json'
import ConfigStore from '../../../main/config-store'
import SpaceUsage from '../utils/spaceusage'

/*
 * Sync Method: One Way, from LOCAL to CLOUD (Only Upload)
 */

const { app } = require('@electron/remote')

ConfigStore.set('isSyncing', false)
ConfigStore.set('stopSync', false)
ConfigStore.set('updatingDB', false)
const wtc = null
let lastSyncFailed = false
let timeoutInstance = null
function syncStop() {
  if (ConfigStore.get('isSyncing')) {
    ConfigStore.set('isSyncing', false)
    ConfigStore.set('stopSync', true)
  }
  app.emit('sync-off')
}

async function SyncLogic(callback) {
  const userDevicesSyncing = await DeviceLock.requestSyncLock()
  if (userDevicesSyncing.data || ConfigStore.get('isSyncing')) {
    Logger.warn('sync not started: another device already syncing')
    return start(callback)
  }
  if (userDevicesSyncing.ensure !== undefined) {
    File.setEnsureMode(userDevicesSyncing.ensure)
  } else {
    File.setEnsureMode(0)
  }
  Logger.info('Sync started')
  DeviceLock.startUpdateDeviceSync()
  app.once('sync-stop', syncStop)
  app.once('user-logout', DeviceLock.stopUpdateDeviceSync)
  ConfigStore.set('isSyncing', true)
  lastSyncFailed = false

  const syncComplete = async function (err) {
    if (err) {
      Logger.error('Error sync monitor:', err.message ? err.message : err)
    }
    console.timeEnd('desktop')
    app.emit('set-tooltip')
    app.emit('sync-off')
    app.removeListener('sync-stop', syncStop)
    app.removeListener('user-logout', DeviceLock.stopUpdateDeviceSync)
    ConfigStore.set('stopSync', false)
    DeviceLock.stopUpdateDeviceSync()
    ConfigStore.set('isSyncing', false)
    const rootFolderExist = await Folder.rootFolderExists()
    if (!rootFolderExist) {
      await database.ClearAll()
      await database.ClearUser()
      database.compactAllDatabases()
      app.emit('user-logout')
      return
    }
    Logger.info('SYNC END')
    SpaceUsage.updateUsage()
      .then(() => { })
      .catch(() => { })
    if (err) {
      Logger.error('Error monitor:', err)
    }
    start(callback)
  }

  async.waterfall(
    [
      next => {
        app.emit('sync-on')
        app.emit('set-tooltip', 'Checking root folder')
        Folder.rootFolderExists()
          .then(exists =>
            next(exists ? null : Error('root folder does not exist'))
          )
          .catch(next)
      },
      next => {
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        // New sync started, so we save the current date
        const now = new Date()
        Logger.log('Sync started at', now.toISOString())
        database
          .Set('syncStartDate', now)
          .then(() => next())
          .catch(next)
      },
      next => {
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        app.emit('set-tooltip', 'Updating user info')
        database
          .Get('xUser')
          .then(user => {
            if (!user.user.bucket) {
              Tree.updateUserObject()
                .then(next)
                .catch(next)
            } else {
              next()
            }
          })
          .catch(next)
      },
      next => {
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        // Sync and update the remote tree.
        app.emit('set-tooltip', 'Updating cloud folders and files')
        console.time('desktop')
        console.time('update list')
        Tree.updateDbAndCompact()
          .then(() => next())
          .catch(next)
      },
      next => {
        console.timeEnd('update list')
        console.time('sincronizar Local folder')
        app.emit('set-tooltip', 'Checking local folders')
        Folder.sincronizeLocalFolder()
          .then(() => next())
          .catch(next)
      },
      next => {
        console.timeEnd('sincronizar Local folder')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        console.time('sincronizar Local files')
        app.emit('set-tooltip', 'Checking local files')
        File.sincronizeLocalFile()
          .then(() => next())
          .catch(next)
      },
      next => {
        console.timeEnd('sincronizar Local files')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        console.time('sincronizar cloud folder')
        app.emit('set-tooltip', 'Checking cloud files')
        Folder.sincronizeCloudFolder()
          .then(next)
          .catch(next)
      },
      next => {
        console.timeEnd('sincronizar cloud folder')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        console.time('sincronizar cloud files')
        app.emit('set-tooltip', 'Checking cloud files')
        File.sincronizeCloudFile()
          .then(next)
          .catch(next)
      },
      next => {
        console.timeEnd('sincronizar cloud files')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        console.time('crearFolder')
        app.emit('set-tooltip', 'Creating folders')
        Folder.createFolders()
          .then(next)
          .catch(next)
      },
      next => {
        console.timeEnd('crearFolder')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        console.time('sincronizeFile')
        app.emit('set-tooltip', 'Synchronizing files')
        File.sincronizeFile()
          .then(next)
          .catch(next)
      },
      next => {
        console.timeEnd('sincronizeFile')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      },
      next => {
        console.time('removeFolders')
        app.emit('set-tooltip', 'Remove folders')
        Folder.removeFolders()
          .then(next)
          .catch(next)
      },
      next => {
        console.timeEnd('removeFolders')
        if (ConfigStore.get('stopSync')) {
          next('stop sync')
        } else {
          next()
        }
      }
    ],
    syncComplete
  )
}

function start(callback, startImmediately = false) {
  if (ConfigStore.get('isSyncing')) {
    return Logger.warn('There is an active sync running right now')
  }
  Logger.info('Start sync')
  let timeout = 0
  if (!startImmediately) {
    timeout = 1000 * 60 * 10
  }
  if (!startImmediately && process.env.NODE_ENV !== 'production') {
    timeout = 1000 * 30
  }
  if (!ConfigStore.get('isSyncing')) {
    clearTimeout(timeoutInstance)
    Logger.log(
      'Waiting %s secs for next sync. Version: v%s',
      timeout / 1000,
      PackageJson.version
    )
    timeoutInstance = setTimeout(() => SyncLogic(callback), timeout)
  }
}

function end() {
  clearInterval(timeoutInstance)
}

export default {
  start,
  end
}

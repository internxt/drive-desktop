import getListingStore from './listing-store'
import { getLocalFilesystem } from './filesystems/local-filesystem'
import { getRemoteFilesystem } from './filesystems/remote-filesystem'
import Sync from './sync'
import { app } from '@electron/remote'
import { ipcRenderer } from 'electron'
import Logger from '../libs/logger'

ipcRenderer
  .invoke('get-sync-details')
  .then(
    async ({
      localPath,
      folderId
    }: {
      localPath: string
      folderId: number
    }) => {
      const tmpPath = app.getPath('temp')

      const remote = getRemoteFilesystem(folderId)
      const local = getLocalFilesystem(localPath, tmpPath)

      const listingStore = getListingStore()

      const remotePath = 'root'

      const sync = new Sync(local, remote, listingStore)

      sync.on('SMOKE_TESTING', () => Logger.log('Smoke testing'))

      sync.on('CHECKING_LAST_RUN_OUTCOME', () =>
        Logger.log('Checking last run outcome')
      )
      sync.on('NEEDS_RESYNC', () => Logger.log('Needs resync'))

      sync.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', () =>
        Logger.log('Generating actions needed to sync')
      )
      sync.on('PULLING_FILE', (name, progress, kind) => {
        Logger.log(`Pulling file ${name} from ${kind}: ${progress * 100}%`)
        app.emit('SYNC_INFO_UPDATE', {
          remotePath,
          localPath,
          action: 'PULL',
          kind,
          progress,
          name
        })
      })

      sync.on('FILE_PULLED', (name, kind) => {
        Logger.log(`File ${name} pulled from ${kind}`)
      })

      sync.on('ERROR_PULLING_FILE', (name, kind) =>
        Logger.log(`Error pulling file ${name} from ${kind}`)
      )

      sync.on('RENAMING_FILE', (oldName, newName, kind) => {
        Logger.log(`Renaming file ${oldName} -> ${newName} in ${kind}`)
        app.emit('SYNC_INFO_UPDATE', {
          remotePath,
          localPath,
          action: 'RENAME',
          kind,
          name: oldName
        })
      })

      sync.on('FILE_RENAMED', (oldName, newName, kind) =>
        Logger.log(`File ${oldName} renamed -> ${newName} in ${kind}`)
      )

      sync.on('ERROR_RENAMING_FILE', (oldName, newName, kind) =>
        Logger.log(
          `Error renaming file from ${oldName} to ${newName} in ${kind}`
        )
      )

      sync.on('DELETING_FILE', (name, kind) => {
        Logger.log(`Deleting file ${name} in ${kind}`)
        app.emit('SYNC_INFO_UPDATE', {
          remotePath,
          localPath,
          action: 'DELETE',
          kind,
          name
        })
      })

      sync.on('ERROR_DELETING_FILE', (name, kind) =>
        Logger.log(`Error deleting file ${name} in ${kind}`)
      )

      sync.on('FILE_DELETED', (name, kind) =>
        Logger.log(`Deleted file ${name} in ${kind}`)
      )

      sync.on('DELETING_FOLDER', (name, kind) => {
        Logger.log(`Deleting folder ${name} in ${kind}`)
        app.emit('SYNC_INFO_UPDATE', {
          remotePath,
          localPath,
          action: 'DELETE',
          kind,
          name
        })
      })

      sync.on('FOLDER_DELETED', (name, kind) =>
        Logger.log(`Deleted folder ${name} in ${kind}`)
      )

      sync.on('ERROR_DELETING_FOLDER', (name, kind) =>
        Logger.log(`Error deleting folder ${name} in ${kind}`)
      )

      sync.on('FINALIZING', () => {
        Logger.log('Finalizing sync')
        app.emit('SYNC_INFO_UPDATE', {
          remotePath,
          localPath,
          action: 'FINALIZE'
        })
      })

      sync.on('DONE', result => {
        Logger.log('Sync done, result: ', result)
        app.emit('SYNC_NEXT', { remotePath, localPath, result })
      })

      try {
        await sync.run()
        Logger.log('Sync exit')
        ipcRenderer.send('SYNC_EXIT')
      } catch (err) {
        Logger.error('Sync fatal error', err)
        ipcRenderer.send('SYNC_FATAL_ERROR', err.name)
      }
    }
  )

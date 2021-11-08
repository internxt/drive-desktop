import getListingStore from './listing-store'
import { getLocalFilesystem } from './filesystems/local-filesystem'
import { getRemoteFilesystem } from './filesystems/remote-filesystem'
import Sync from './sync'
import { app } from '@electron/remote'
import {ipcRenderer} from 'electron'

  ipcRenderer.invoke('getSyncDetails').then(async ({localPath, folderId}: {localPath: string, folderId: number}) => {
    const tmpPath = app.getPath('temp')

    const remote = getRemoteFilesystem(folderId)
    const local = getLocalFilesystem(localPath, tmpPath)

    const listingStore = getListingStore(localPath, folderId)

    const sync = new Sync(local, remote, listingStore)

    sync.on('SMOKE_TESTING', () => console.log('Smoke testing'))
    sync.on('CHECKING_LAST_RUN_OUTCOME', () =>
      console.log('Checking last run outcome')
    )
    sync.on('NEEDS_RESYNC', () => console.log('Needs resync'))
    sync.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', () =>
      console.log('Generating actions needed to sync')
    )
    sync.on('PULLING_FILE', (name, progress, kind) =>
      console.log(`Pulling file ${name} from ${kind}: ${progress * 100}%`)
    )
    sync.on('FILE_PULLED', (name, kind) =>
      console.log(`File ${name} pulled from ${kind}`)
    )
    sync.on('ERROR_PULLING_FILE', (name, kind) =>
      console.log(`Error pulling file ${name} from ${kind}`)
    )
    sync.on('RENAMING_FILE', (oldName, newName, kind) =>
      console.log(`Renaming file ${oldName} -> ${newName} in ${kind}`)
    )
    sync.on('FILE_RENAMED', (oldName, newName, kind) =>
      console.log(`File ${oldName} renamed -> ${newName} in ${kind}`)
    )
    sync.on('ERROR_RENAMING_FILE', (oldName, newName, kind) =>
      console.log(`Error renaming file from ${oldName} to ${newName} in ${kind}`)
    )
    sync.on('DELETING_FILE', (name, kind) =>
      console.log(`Deleting file ${name} in ${kind}`)
    )
    sync.on('ERROR_DELETING_FILE', (name, kind) =>
      console.log(`Error deleting file ${name} in ${kind}`)
    )
    sync.on('FILE_DELETED', (name, kind) =>
      console.log(`Deleted file ${name} in ${kind}`)
    )
    sync.on('DELETING_FOLDER', (name, kind) =>
      console.log(`Deleting folder ${name} in ${kind}`)
    )
    sync.on('FOLDER_DELETED', (name, kind) =>
      console.log(`Deleted folder ${name} in ${kind}`)
    )
    sync.on('ERROR_DELETING_FOLDER', (name, kind) =>
      console.log(`Error deleting folder ${name} in ${kind}`)
    )
    sync.on('FINALIZING', () => console.log('Finalizing'))
    sync.on('DONE', result => console.log('Done, result: ', result))

    try{
      await sync.run()
      ipcRenderer.send('SYNC_EXIT')
    } catch(err) {
      console.log("Fatal error", err)
      ipcRenderer.send('SYNC_FATAL_ERROR')
    }
  })
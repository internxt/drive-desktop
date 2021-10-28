import getListingStore from "./listing-store"
import configStore from "../main/config-store"
import { getLocalFilesystem } from "./local-filesystem"
import { getRemoteFilesystem } from "./remote-filesystem"
import Sync from "./sync"
import {app} from '@electron/remote'

(async function () {
  await new Promise((resolve) => setTimeout(resolve, 5000))
  // testing phase
  const localPath = '/Users/alex/Internxt Drive/'
  const tmpPath = app.getPath('temp')
  const remoteFolderId = 30584191

	const remote = getRemoteFilesystem(remoteFolderId)
	const local = getLocalFilesystem(localPath, tmpPath)

  const listingStore = getListingStore(localPath, remoteFolderId, configStore)

  const sync = new Sync(local, remote, listingStore)

  sync.on('CHECKING_LAST_RUN_OUTCOME', () => console.log('Cheking last run outcome'))
  sync.on('NEEDS_RESYNC', () => console.log('Needs resync'))
  sync.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', () => console.log("Generating actions needed to sync"))
  sync.on('PULLING_FILE', (name, progress, kind) => console.log(`Pulling file ${name} from ${kind}: ${progress * 100}%`))
  sync.on('FILE_PULLED', (name, kind) => console.log(`File ${name} pulled from ${kind}`))
  sync.on('RENAMING_FILE', (oldName, newName, kind) => console.log(`Renaming file ${oldName} -> ${newName} in ${kind}`))
  sync.on('FILE_RENAMED', (oldName, newName, kind) => console.log(`File ${oldName} renamed -> ${newName} in ${kind}`))
  sync.on('DELETING_FILE', (name, kind) => console.log(`Deleting file ${name} in ${kind}`))
  sync.on('FILE_DELETED', (name, kind) => console.log(`Deleted file ${name} in ${kind}`))
  sync.on('DELETING_FOLDER', (name, kind) => console.log(`Deleting folder ${name} in ${kind}`))
  sync.on('FOLDER_DELETED', (name, kind) => console.log(`Deleted folder ${name} in ${kind}`))
  sync.on('FINALIZING', () => console.log('Finalizing'))
  sync.on('DONE', (result) => console.log("Done, result: ", result))

  await sync.run()
})()

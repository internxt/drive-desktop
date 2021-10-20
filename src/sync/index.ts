import { getLocalFilesystem } from "./local-filesystem"
import { getRemoteFilesystem } from "./remote-filesystem"
import Sync from "./sync"

(async function () {
  await new Promise((resolve) => setTimeout(resolve, 5000))
  // testing phase
  const localPath = '/Users/alex/Internxt Drive/'
  const remoteFolderId = 30584191

	const remote = getRemoteFilesystem(remoteFolderId, localPath)
	const local = getLocalFilesystem(localPath, remote.downloadFile)

  const sync = new Sync(local, remote)

  sync.on('CHECKING_LAST_RUN_OUTCOME', () => console.log('chekinglastrunoutcome'))
  sync.on('DONE', () => console.log('done'))
  await sync.run()
})()

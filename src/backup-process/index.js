import getOldestBackupPending from './getOldestBackupPending'
import crypt from '../renderer/logic/crypt'
const archiver = require('archiver')

async function main () {
  const backup = await getOldestBackupPending()
  const hash = await zipAndHash(backup.path)
}

main()

function zipAndHash(backupPath) {
  const archive = archiver('zip', {zlib: {level: 9}})

  archive.on('error', err => { throw err })

  archive.directory(backupPath, false)

  archive.finalize()

  return crypt.streamHash(archive)
}

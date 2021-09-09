import {getAllBackups} from './service'

export default async function () {
  const backups = await getAllBackups()
  const backupsThatWereNeverDone = backups.filter((backup) => backup.fileId === null)

  if (backupsThatWereNeverDone.length) { return backupsThatWereNeverDone.pop() }

  const currentTime = new Date().valueOf()

  const dueBackups = backups.map(backup => ({...backup, updatedAt: backup.updateAt.valueOf()})).filter((backup) => backup.updatedAt + backup.interval <= currentTime)

  if (dueBackups.length === 0) { return null }

  const dueBackupsSortedOlderFirst = dueBackups.sort((a, b) => a.updatedAt - b.updatedAt)

  return dueBackupsSortedOlderFirst[0]
}

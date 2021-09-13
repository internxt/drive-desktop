import { getAllBackups } from './service'

export default async function(backupsToExclude = new Set()) {
  const backups = (await getAllBackups()).filter(
    backup => backup.enabled && !backupsToExclude.has(backup.id)
  )

  if (backups.length === 0) return null

  const backupThatWasNeverDone = backups.find(
    backup => backup.lastBackupAt === null
  )

  if (backupThatWasNeverDone) {
    return backupThatWasNeverDone
  }

  const sortedBackupsWithOldestFirst = backups.sort(
    (a, b) => a.lastBackupAt - b.lastBackupAt
  )

  return sortedBackupsWithOldestFirst[0]
}

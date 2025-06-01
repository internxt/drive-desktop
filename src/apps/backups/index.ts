import { Backup } from './Backups';
import { BackupsContext } from './BackupInfo';
import { BackupsDependencyContainerFactory } from './dependency-injection/BackupsDependencyContainerFactory';
import { BackupsProcessTracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

export async function backupFolder(tracker: BackupsProcessTracker, context: BackupsContext) {
  const container = BackupsDependencyContainerFactory.build(context);

  // window.addEventListener('offline', () => {
  //   Logger.log('[BACKUPS] Internet connection lost');
  //   abortController.abort('CONNECTION_LOST');
  //   BackupsIPCRenderer.send('backups.backup-failed', data.folderId, 'NO_INTERNET');
  // });

  const backup = container.get(Backup);
  await backup.run(tracker, context);
}

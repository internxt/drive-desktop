import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { BackupsContext } from './BackupInfo';
import { logger } from '@/apps/shared/logger/logger';
import { RemoteTree, Traverser } from './remote-tree/traverser';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { BackupsProcessTracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { calculateFilesDiff, FilesDiff } from './diff/calculate-files-diff';
import { calculateFoldersDiff, FoldersDiff } from './diff/calculate-folders-diff';
import { createFolders } from './folders/create-folders';
import { deleteRemoteFiles } from './process-files/delete-remote-files';

type Props = {
  tracker: BackupsProcessTracker;
  context: BackupsContext;
};

export class Backup {
  backed = 0;

  async run({ tracker, context }: Props) {
    const local = await LocalTreeBuilder.run({ context });
    const remote = await new Traverser().run({ context });

    const foldersDiff = calculateFoldersDiff({ local, remote });
    const filesDiff = calculateFilesDiff({ local, remote });

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Files diff',
      added: filesDiff.added.length,
      modified: filesDiff.modified.length,
      deleted: filesDiff.deleted.length,
      unmodified: filesDiff.unmodified.length,
      total: filesDiff.total,
    });

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Folders diff',
      added: foldersDiff.added.length,
      deleted: foldersDiff.deleted.length,
      unmodified: foldersDiff.unmodified.length,
      total: foldersDiff.total,
    });

    const alreadyBacked = filesDiff.unmodified.length + foldersDiff.unmodified.length;

    this.backed = alreadyBacked;

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Total items to backup',
      total: filesDiff.total + foldersDiff.total,
      alreadyBacked,
    });

    tracker.currentTotal(filesDiff.total + foldersDiff.total);
    tracker.currentProcessed(alreadyBacked);

    await this.backupFolders(context, tracker, foldersDiff, remote);
    await this.backupFiles(context, tracker, filesDiff, remote);
  }

  private async backupFolders(context: BackupsContext, tracker: BackupsProcessTracker, diff: FoldersDiff, remote: RemoteTree) {
    const { added, deleted } = diff;

    return await Promise.all([
      this.deleteRemoteFolders(context, deleted),
      createFolders({ self: this, context, tracker, added, tree: remote }),
    ]);
  }

  private async backupFiles(context: BackupsContext, tracker: BackupsProcessTracker, diff: FilesDiff, remote: RemoteTree) {
    const { added, modified, deleted } = diff;

    await Promise.all([
      FileBatchUploader.run({ self: this, tracker, context, remoteTree: remote, added }),
      FileBatchUpdater.run({ self: this, tracker, context, modified }),
      deleteRemoteFiles({ context, deleted }),
    ]);
  }

  private async deleteRemoteFolders(context: BackupsContext, deleted: FoldersDiff['deleted']) {
    for (const folder of deleted) {
      if (context.abortController.signal.aborted) {
        return;
      }

      await driveServerWip.storage.deleteFolderByUuid({
        uuid: folder.uuid,
        workspaceToken: '',
      });
    }
  }
}

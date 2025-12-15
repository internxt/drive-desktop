import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { BackupsContext } from './BackupInfo';
import { logger } from '@/apps/shared/logger/logger';
import { Traverser } from './remote-tree/traverser';
import { BackupsProcessTracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { calculateFilesDiff } from './diff/calculate-files-diff';
import { calculateFoldersDiff } from './diff/calculate-folders-diff';
import { createFolders } from './folders/create-folders';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { replaceFiles } from './process-files/replace-files';
import { createFiles } from './process-files/create-files';
import { deleteFiles } from './process-files/delete-files';
import { deleteFolders } from './folders/delete-folders';

type Props = {
  tracker: BackupsProcessTracker;
  context: BackupsContext;
};

export class Backup {
  backed = 0;

  async run({ tracker, context }: Props) {
    const local = await LocalTreeBuilder.run({ context });
    const remote = await Traverser.run({
      userUuid: context.userUuid,
      rootPath: context.pathname,
      rootUuid: context.folderUuid as FolderUuid,
    });

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

    if (context.abortController.signal.aborted) return;

    tracker.currentTotal(filesDiff.total + foldersDiff.total);
    tracker.currentProcessed(alreadyBacked);

    await Promise.all([
      deleteFolders({ self: this, deleted: foldersDiff.deleted }),
      replaceFiles({ self: this, tracker, context, modified: filesDiff.modified }),
      deleteFiles({ self: this, deleted: filesDiff.deleted }),
      createFolders({ self: this, context, tracker, added: foldersDiff.added, tree: remote }).then(() => {
        return createFiles({ self: this, tracker, context, remoteTree: remote, added: filesDiff.added });
      }),
    ]);
  }
}

import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { BackupsContext } from './BackupInfo';
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
  ctx: BackupsContext;
};

export class Backup {
  backed = 0;

  async run({ tracker, ctx }: Props) {
    const local = await LocalTreeBuilder.run({ ctx });
    const remote = await Traverser.run({
      userUuid: ctx.userUuid,
      rootPath: ctx.pathname,
      rootUuid: ctx.folderUuid as FolderUuid,
    });

    const foldersDiff = calculateFoldersDiff({ local, remote });
    const filesDiff = calculateFilesDiff({ local, remote });

    ctx.logger.debug({
      msg: 'Files diff',
      added: filesDiff.added.length,
      modified: filesDiff.modified.length,
      deleted: filesDiff.deleted.length,
      unmodified: filesDiff.unmodified.length,
      total: filesDiff.total,
    });

    ctx.logger.debug({
      msg: 'Folders diff',
      added: foldersDiff.added.length,
      deleted: foldersDiff.deleted.length,
      unmodified: foldersDiff.unmodified.length,
      total: foldersDiff.total,
    });

    const alreadyBacked = filesDiff.unmodified.length + foldersDiff.unmodified.length;

    this.backed = alreadyBacked;

    ctx.logger.debug({
      msg: 'Total items to backup',
      total: filesDiff.total + foldersDiff.total,
      alreadyBacked,
    });

    if (ctx.abortController.signal.aborted) return;

    tracker.currentTotal(filesDiff.total + foldersDiff.total);
    tracker.currentProcessed(alreadyBacked);

    await Promise.all([
      deleteFolders({ ctx, self: this, deleted: foldersDiff.deleted }),
      deleteFiles({ ctx, self: this, deleted: filesDiff.deleted }),
      replaceFiles({ self: this, tracker, ctx, modified: filesDiff.modified }),
      createFolders({ self: this, ctx, tracker, added: foldersDiff.added, tree: remote }).then(() => {
        return createFiles({ self: this, tracker, ctx, remoteTree: remote, added: filesDiff.added });
      }),
    ]);
  }
}

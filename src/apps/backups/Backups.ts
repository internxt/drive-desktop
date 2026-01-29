import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { BackupsContext } from './BackupInfo';
import { Traverser } from './remote-tree/traverser';
import { tracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { calculateFilesDiff } from './diff/calculate-files-diff';
import { calculateFoldersDiff } from './diff/calculate-folders-diff';
import { createFolders } from './folders/create-folders';
import { FolderUuid } from '../main/database/entities/DriveFolder';
import { replaceFiles } from './process-files/replace-files';
import { createFiles } from './process-files/create-files';
import { deleteFiles } from './process-files/delete-files';
import { deleteFolders } from './folders/delete-folders';

type Props = {
  ctx: BackupsContext;
};

export class Backup {
  static async run({ ctx }: Props) {
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

    const total = filesDiff.total + foldersDiff.total;
    const backed = filesDiff.unmodified.length + foldersDiff.unmodified.length;

    ctx.logger.debug({
      msg: 'Total items to backup',
      total,
      backed,
    });

    if (ctx.abortController.signal.aborted) return;

    tracker.currentTotal(total, backed);

    await Promise.all([
      deleteFolders({ ctx, deleted: foldersDiff.deleted }),
      deleteFiles({ ctx, deleted: filesDiff.deleted }),
      replaceFiles({ ctx, modified: filesDiff.modified }),
      createFolders({ ctx, added: foldersDiff.added, tree: remote }).then(() => {
        return createFiles({ ctx, remoteTree: remote, added: filesDiff.added });
      }),
    ]);
  }
}

import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from '../BackupInfo';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';
import { RemoteTree } from '../remote-tree/traverser';
import { basename } from 'node:path';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';
import type { Backup } from '../Backups';
import { createFolder } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  self: Backup;
  context: BackupsContext;
  tracker: BackupsProcessTracker;
  added: Array<LocalFolder>;
  tree: RemoteTree;
};

export async function createFolders({ self, context, added, tree, tracker }: TProps) {
  const sortedAdded = added.toSorted((a, b) => a.relativePath.localeCompare(b.relativePath));

  for (const localFolder of sortedAdded) {
    if (context.abortController.signal.aborted) {
      return;
    }

    if (localFolder.relativePath === '/') {
      continue; // Ignore root folder
    }

    const parentPath = pathUtils.dirname(localFolder.relativePath);
    const parent = tree.folders[parentPath];

    if (!parent) {
      logger.error({
        tag: 'BACKUPS',
        msg: 'Parent folder does not exist',
        relativePath: localFolder.relativePath,
        parentPath,
      });

      context.addIssue({ error: 'CREATE_FOLDER_FAILED', name: localFolder.absolutePath });
    } else {
      const { data: folder, error } = await createFolder({
        path: localFolder.relativePath,
        plainName: basename(localFolder.relativePath),
        parentUuid: parent.uuid,
        userUuid: context.userUuid,
        workspaceId: '',
      });

      if (folder) {
        tree.folders[localFolder.relativePath] = {
          ...folder,
          path: localFolder.relativePath,
          absolutePath: localFolder.absolutePath,
        };
      } else if (error.code !== 'ABORTED') {
        context.addIssue({ error: 'CREATE_FOLDER_FAILED', name: localFolder.absolutePath });
      }
    }

    self.backed++;
    tracker.currentProcessed(self.backed);
  }
}

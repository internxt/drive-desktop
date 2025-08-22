import { BackupsProcessTracker } from '@/apps/main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import { BackupsContext } from '../BackupInfo';
import { LocalFolder } from '@/context/local/localFolder/domain/LocalFolder';
import { RemoteTree } from '../remote-tree/traverser';
import { basename } from 'path';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@/apps/shared/logger/logger';
import type { Backup } from '../Backups';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';

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

      /**
       * v2.5.3 Daniel Jiménez
       * TODO: add issue
       */
    } else {
      const { data } = await driveServerWip.folders.createFolder({
        path: localFolder.relativePath,
        body: {
          plainName: basename(localFolder.relativePath),
          parentFolderUuid: parent.uuid,
        },
      });

      if (data) {
        tree.folders[localFolder.relativePath] = Folder.from({
          ...data,
          path: localFolder.relativePath,
        });
      } else {
        /**
         * v2.5.3 Daniel Jiménez
         * TODO: add issue
         */
      }
    }

    self.backed++;
    tracker.currentProcessed(self.backed);
  }
}

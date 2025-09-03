import { sleep } from '@/apps/main/util';
import { updateFolderStatuses } from './update-folder-statuses';
import { updateFileStatuses } from './update-file-statuses';
import { logger } from '@/apps/shared/logger/logger';
import { SyncContext } from '@/apps/sync-engine/config';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  context: SyncContext;
  rootFolderUuid: FolderUuid;
};

export async function syncItemsByFolder({ context, rootFolderUuid }: TProps) {
  const folders = [{ folderUuid: rootFolderUuid, path: createRelativePath('/') }];

  while (folders.length > 0) {
    if (context.abortController.signal.aborted) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Aborted sync items by folder', workspaceId: context.workspaceId });
      break;
    }

    const folder = folders.shift();
    if (!folder) continue;

    const { folderUuid, path } = folder;

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Updating file and folder statuses',
      workspaceId: context.workspaceId,
      path,
      folderUuid,
    });

    const foldersPromise = updateFolderStatuses({ context, folderUuid, path });
    const filesPromise = updateFileStatuses({ context, folderUuid });

    const [newFolderUuids] = await Promise.all([foldersPromise, filesPromise]);
    folders.push(...newFolderUuids);
    /**
     * v2.5.6 Daniel Jiménez
     * Since this is a fetch that is going to run everytime in the background,
     * we don't want to saturate the server, so we wait 10 seconds before the next folder.
     */
    await sleep(10_000);
  }
}

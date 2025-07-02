import { sleep } from '@/apps/main/util';
import { updateFolderStatuses } from './update-folder-statuses';
import { updateFileStatuses } from './update-file-statuses';
import { logger } from '@/apps/shared/logger/logger';
import { Config } from '@/apps/sync-engine/config';

type TProps = {
  context: Config;
  rootFolderUuid: string;
};

export async function syncItemsByFolder({ context, rootFolderUuid }: TProps) {
  const folderUuids = [rootFolderUuid];

  while (folderUuids.length > 0) {
    const folderUuid = folderUuids.shift();
    if (!folderUuid) continue;

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Updating file and folder statuses',
      workspaceId: context.workspaceId,
      folderUuid,
    });

    const foldersPromise = updateFolderStatuses({ context, folderUuid });
    const filesPromise = updateFileStatuses({ context, folderUuid });

    const [newFolderUuids] = await Promise.all([foldersPromise, filesPromise]);
    folderUuids.push(...newFolderUuids);
    /**
     * v2.5.6 Daniel Jiménez
     * Since this is a fetch that is going to run everytime in the background,
     * we don't want to saturate the server, so we wait 10 seconds before the next folder.
     */
    await sleep(10_000);
  }
}

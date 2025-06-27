import { sleep } from '@/apps/main/util';
import { updateFolderStatuses } from './update-folder-statuses';
import { updateFileStatuses } from './update-file-statuses';
import { TSyncContext } from '../domain/sync-context';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  context: TSyncContext;
  rootFolderUuid: string;
};

export async function updateItemStatuses({ context, rootFolderUuid }: TProps) {
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
    await sleep(10_000);
  }
}

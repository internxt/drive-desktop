import { logger } from '@/apps/shared/logger/logger';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFolder } from '../update-in-sqlite/create-or-update-folder';

type TProps = {
  context: SyncContext;
  folderUuid: string;
};

export async function updateFolderStatuses({ context, folderUuid }: TProps) {
  let folderUuids: string[] = [];

  try {
    const folders = await fetchFoldersByFolder({ context, folderUuid });
    folderUuids = folders.map((folder) => folder.uuid);

    const promises = folders.map((folderDto) =>
      createOrUpdateFolder({
        context,
        folderDto: {
          ...folderDto,
          updatedAt: '2000-01-01T00:00:00.000Z',
        },
      }),
    );
    await Promise.all(promises);
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update folder statuses failed',
      folderUuid,
      exc,
    });
  }

  return folderUuids;
}

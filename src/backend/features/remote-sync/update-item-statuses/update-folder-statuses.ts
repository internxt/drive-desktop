import { driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { TSyncContext } from '../domain/sync-context';
import { In, Not } from 'typeorm';
import { logger } from '@/apps/shared/logger/logger';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';

type TProps = {
  context: TSyncContext;
  folderUuid: string;
};

export async function updateFolderStatuses({ context, folderUuid }: TProps) {
  let folderUuids: string[] = [];

  try {
    const folders = await fetchFoldersByFolder({ context, folderUuid });
    folderUuids = folders.map((folder) => folder.uuid);

    await driveFoldersCollection.updateInBatch({
      payload: { status: 'EXISTS' },
      where: { parentUuid: folderUuid, uuid: In(folderUuids) },
    });

    await driveFoldersCollection.updateInBatch({
      payload: { status: 'TRASHED' },
      where: { parentUuid: folderUuid, uuid: Not(In(folderUuids)) },
    });
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

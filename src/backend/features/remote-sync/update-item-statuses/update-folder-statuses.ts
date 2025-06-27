import { driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { In, Not } from 'typeorm';
import { logger } from '@/apps/shared/logger/logger';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { Config } from '@/apps/sync-engine/config';

type TProps = {
  context: Config;
  folderUuid: string;
};

export async function updateFolderStatuses({ context, folderUuid }: TProps) {
  let folderUuids: string[] = [];

  try {
    const folders = await fetchFoldersByFolder({ context, folderUuid });
    folderUuids = folders.map((folder) => folder.uuid);

    /**
     * v2.5.6 Daniel Jiménez
     * TODO: this should be improved because it can happen that the folder doesn't exist in our local database,
     * and we have to create it, however, we cannot do that yet because we will break the checkpoint
     */
    await driveFoldersCollection.updateInBatch({
      payload: { status: 'EXISTS' },
      where: { parentUuid: folderUuid, uuid: In(folderUuids) },
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

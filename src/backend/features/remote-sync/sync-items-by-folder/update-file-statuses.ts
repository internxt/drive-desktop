import { driveFilesCollection } from '@/apps/main/remote-sync/store';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { In } from 'typeorm';
import { logger } from '@/apps/shared/logger/logger';
import { Config } from '@/apps/sync-engine/config';

type TProps = {
  context: Config;
  folderUuid: string;
};

export async function updateFileStatuses({ context, folderUuid }: TProps) {
  try {
    const files = await fetchFilesByFolder({ context, folderUuid });
    const fileUuids = files.map((file) => file.uuid);

    /**
     * v2.5.6 Daniel Jiménez
     * TODO: this should be improved because it can happen that the file doesn't exist in our local database,
     * and we have to create it, however, we cannot do that yet because we will break the checkpoint
     */
    await driveFilesCollection.updateInBatch({
      payload: { status: 'EXISTS' },
      where: { folderUuid, uuid: In(fileUuids) },
    });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update file statuses failed',
      folderUuid,
      exc,
    });
  }
}

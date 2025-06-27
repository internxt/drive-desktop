import { driveFilesCollection } from '@/apps/main/remote-sync/store';
import { TSyncContext } from '../domain/sync-context';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { In, Not } from 'typeorm';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  context: TSyncContext;
  folderUuid: string;
};

export async function updateFileStatuses({ context, folderUuid }: TProps) {
  try {
    const files = await fetchFilesByFolder({ context, folderUuid });
    const fileUuids = files.map((file) => file.uuid);

    await driveFilesCollection.updateInBatch({
      payload: { status: 'EXISTS' },
      where: { folderUuid, uuid: In(fileUuids) },
    });

    await driveFilesCollection.updateInBatch({
      payload: { status: 'TRASHED' },
      where: { folderUuid, uuid: Not(In(fileUuids)) },
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

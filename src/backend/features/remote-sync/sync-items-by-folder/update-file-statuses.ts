import { fetchFilesByFolder } from './fetch-files-by-folder';
import { logger } from '@/apps/shared/logger/logger';
import { Config } from '@/apps/sync-engine/config';
import { createOrUpdateFile } from '../update-in-sqlite/create-or-update-file';

type TProps = {
  context: Config;
  folderUuid: string;
};

export async function updateFileStatuses({ context, folderUuid }: TProps) {
  try {
    const files = await fetchFilesByFolder({ context, folderUuid });
    const promises = files.map((fileDto) =>
      createOrUpdateFile({
        context,
        fileDto: {
          ...fileDto,
          updatedAt: '2000-01-01T00:00:00Z',
        },
      }),
    );
    await Promise.all(promises);
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update file statuses failed',
      folderUuid,
      exc,
    });
  }
}

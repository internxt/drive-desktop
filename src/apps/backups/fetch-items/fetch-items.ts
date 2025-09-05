import { logger } from '@/apps/shared/logger/logger';
import { fetchItemsByFolder } from './fetch-items-by-folder';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';

type TProps = {
  folderUuid: string;
  skipFiles: boolean;
  abortSignal: AbortSignal;
};

export async function fetchItems({ folderUuid, skipFiles, abortSignal }: TProps) {
  try {
    logger.debug({ tag: 'BACKUPS', msg: 'Fetch backup items started' });

    const allFolders: SimpleDriveFolder[] = [];
    const allFiles: SimpleDriveFile[] = [];

    await fetchItemsByFolder({
      folderUuid,
      allFolders,
      allFiles,
      skipFiles,
      abortSignal,
    });

    logger.debug({
      tag: 'BACKUPS',
      msg: 'Fetch backup items finished',
      files: allFiles.length,
      folders: allFolders.length,
    });

    return { folders: allFolders, files: allFiles };
  } catch (error) {
    throw logger.error({
      tag: 'BACKUPS',
      msg: 'Fetch backup items failed',
      exc: error,
    });
  }
}

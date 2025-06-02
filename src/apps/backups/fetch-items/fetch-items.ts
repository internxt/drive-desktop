import { logger } from '@/apps/shared/logger/logger';
import { FileDto, FolderDto } from '@/infra/drive-server-wip/out/dto';
import { fetchItemsByFolder } from './fetch-items-by-folder';

type TProps = {
  folderUuid: string;
  skipFiles: boolean;
  abortSignal: AbortSignal;
};

export async function fetchItems({ folderUuid, skipFiles, abortSignal }: TProps) {
  try {
    logger.debug({
      tag: 'BACKUPS',
      msg: 'Fetch backup items started',
      folderUuid,
    });

    const allFolders: FolderDto[] = [];
    const allFiles: FileDto[] = [];

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
      folderUuid,
      files: allFiles.length,
      folders: allFolders.length,
    });

    return { folders: allFolders, files: allFiles };
  } catch (error) {
    throw logger.error({
      tag: 'BACKUPS',
      msg: 'Fetch backup items failed',
      folderUuid,
      exc: error,
    });
  }
}

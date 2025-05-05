import { logger } from '@/apps/shared/logger/logger';
import { FileDto, FolderDto } from '@/infra/drive-server-wip/out/dto';
import { fetchItemsByFolder } from './fetch-items-by-folder';

type TProps = {
  folderUuid: string;
  skipFiles: boolean;
};

export async function fetchItems({ folderUuid, skipFiles }: TProps) {
  try {
    logger.debug({
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
    });

    logger.debug({
      msg: 'Fetch backup items finished',
      folderUuid,
      files: allFiles.length,
      folders: allFolders.length,
    });

    return { folders: allFolders, files: allFiles };
  } catch (error) {
    throw logger.error({
      msg: 'Fetch backup items failed',
      folderUuid,
      exc: error,
    });
  }
}

import { Container } from 'diod';
import { Result } from '../../../../../context/shared/domain/Result';
import { FILE_MODE, FOLDER_MODE } from '../../constants';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FilesByFolderPathSearcher } from '../../../../../context/virtual-drive/files/application/search/FilesByFolderPathSearcher';
import { FoldersByParentPathLister } from '../../../../../context/virtual-drive/folders/application/FoldersByParentPathLister';
import { TemporalFileByFolderFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByFolderFinder';
import { FolderNotFoundError } from '../../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export type DirEntry = {
  name: string;
  mode: number;
};

export type OpenDirData = {
  entries: DirEntry[];
};

export async function opendir(path: string, container: Container): Promise<Result<OpenDirData, FuseError>> {
  try {
    const [fileNames, folderNames, temporalFiles] = await Promise.all([
      container.get(FilesByFolderPathSearcher).run(path),
      container.get(FoldersByParentPathLister).run(path),
      container.get(TemporalFileByFolderFinder).run(path),
    ]);

    const entries: DirEntry[] = [
      ...fileNames.map((name) => ({ name, mode: FILE_MODE })),
      ...folderNames.map((name) => ({ name, mode: FOLDER_MODE })),
      ...temporalFiles.filter((f) => f.isAuxiliary()).map((f) => ({ name: f.name, mode: FILE_MODE })),
    ];

    return { data: { entries } };
  } catch (err) {
    if (err instanceof FolderNotFoundError) {
      logger.debug({ msg: '[FUSE - OpenDir] Folder not yet synced, returning empty', path });
      return { data: { entries: [] } };
    }
    logger.error({ msg: '[FUSE - OpenDir] Error reading directory', error: err, path });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - OpenDir] IO error: ${path}`) };
  }
}

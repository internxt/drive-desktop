import { logger } from '@internxt/drive-desktop-core/build/backend';
import { basename } from 'node:path';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { FolderDeleter } from '../../../../../context/virtual-drive/folders/application/FolderDeleter';
import { SingleFolderMatchingFinder } from '../../../../../context/virtual-drive/folders/application/SingleFolderMatchingFinder';
import { FolderStatuses } from '../../../../../context/virtual-drive/folders/domain/FolderStatus';
import { SyncFolderMessenger } from '../../../../../context/virtual-drive/folders/domain/SyncFolderMessenger';
import { FolderNotFoundError } from '../../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';

export async function rmdir(path: string, container: Container): Promise<Result<void, FuseError>> {
  try {
    const folder = await container.get(SingleFolderMatchingFinder).run({
      path,
      status: FolderStatuses.EXISTS,
    });

    await container.get(FolderDeleter).run(folder.uuid);

    return { data: undefined };
  } catch (error: unknown) {
    await container.get(SyncFolderMessenger).issue({
      error: 'FOLDER_TRASH_ERROR',
      cause: 'UNKNOWN',
      name: basename(path),
    });

    if (error instanceof FolderNotFoundError) {
      const msg = `[FUSE - Rmdir] Folder not found: ${path}`;
      logger.error({ msg });
      return { error: new FuseError(FuseCodes.ENOENT, msg) };
    }

    const msg = `[FUSE - Rmdir] Unable to trash folder: ${path}`;
    logger.error({ msg });
    return { error: new FuseError(FuseCodes.EIO, msg) };
  }
}

import { logger } from '@/apps/shared/logger/logger';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath, pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
  folderCreator: FolderCreator;
};

export async function createParentFolder({ path, ...props }: TProps) {
  const posixDir = pathUtils.dirname(path);
  await createFolder({ path: posixDir, ...props });
}

export async function createFolder({ ctx, path, absolutePath, folderCreator }: TProps) {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Create folder',
    path,
  });

  try {
    await folderCreator.run({ ctx, path, absolutePath });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path, absolutePath, folderCreator });
      await createFolder({ ctx, path, absolutePath, folderCreator });
    } else {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating folder',
        path,
        error,
      });
    }
  }
}

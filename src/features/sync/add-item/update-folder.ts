import { logger } from '@/apps/shared/logger/logger';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  path: RelativePath;
  folderCreator: FolderCreator;
};

export async function createParentFolder({ path, ...props }: TProps) {
  const posixDir = pathUtils.dirname(path);
  await createFolder({ path: posixDir, ...props });
}

export async function createFolder({ path, folderCreator }: TProps) {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Create folder',
    path,
  });

  try {
    await folderCreator.run({ path });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ path, folderCreator });
      await createFolder({ path, folderCreator });
    } else {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating folder',
        path,
        error,
      });
    }
  }
}

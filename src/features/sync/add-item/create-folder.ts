import { logger } from '@/apps/shared/logger/logger';
import { PlatformPathConverter } from '@/context/virtual-drive/shared/application/PlatformPathConverter';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';

type TProps = {
  posixRelativePath: string;
  folderCreator: FolderCreator;
};

export async function createParentFolder({ posixRelativePath, ...props }: TProps) {
  const posixDir = PlatformPathConverter.getFatherPathPosix(posixRelativePath);
  await createFolder({ posixRelativePath: posixDir, ...props });
}

export async function createFolder({ posixRelativePath, folderCreator }: TProps) {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Create folder',
    posixRelativePath,
  });

  try {
    await folderCreator.run({ path: posixRelativePath });
  } catch (error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error creating folder',
      posixRelativePath,
      error,
    });

    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ posixRelativePath, folderCreator });
      await createFolder({ posixRelativePath, folderCreator });
    } else {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating folder inside catch',
        error,
      });
    }
  }
}

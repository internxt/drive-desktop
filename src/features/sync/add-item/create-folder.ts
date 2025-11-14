import { logger } from '@/apps/shared/logger/logger';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { pathUtils } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function createParentFolder({ path, ...props }: TProps) {
  const posixDir = pathUtils.dirname(path);
  await createFolder({ path: posixDir, ...props });
}

export async function createFolder({ ctx, path }: TProps) {
  logger.debug({
    tag: 'SYNC-ENGINE',
    msg: 'Create folder',
    path,
  });

  try {
    await FolderCreator.run({ ctx, path });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path });
      await createFolder({ ctx, path });
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

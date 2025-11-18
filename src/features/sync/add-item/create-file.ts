import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { Stats } from 'node:fs';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  stats: Stats;
};

export async function createFile({ ctx, path, stats }: TProps) {
  try {
    const uuid = await FileCreationOrchestrator.run({ ctx, path, stats });
    ctx.virtualDrive.convertToPlaceholder({ path, id: `FILE:${uuid}` });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path });
      return await createFile({ ctx, path, stats });
    } else {
      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating file',
        path,
        error,
      });
    }
  }
}

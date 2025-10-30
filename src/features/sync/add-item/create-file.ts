import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { Stats } from 'node:fs';
import { updateFileStatus } from '@/backend/features/local-sync/placeholders/update-file-status';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: ProcessSyncContext;
  absolutePath: AbsolutePath;
  path: RelativePath;
  stats: Stats;
};

export async function createFile({ ctx, absolutePath, path, stats }: TProps) {
  try {
    const uuid = await FileCreationOrchestrator.run({ ctx, path, absolutePath, stats });
    ctx.virtualDrive.convertToPlaceholder({ itemPath: path, id: `FILE:${uuid}` });
    updateFileStatus({ ctx, path });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path, absolutePath });
      return await createFile({
        ctx,
        absolutePath,
        path,
        stats,
      });
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

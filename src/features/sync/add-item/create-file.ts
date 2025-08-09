import { logger } from '@/apps/shared/logger/logger';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { createFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { Stats } from 'fs';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { SyncContext } from '@/apps/sync-engine/config';

type TProps = {
  ctx: SyncContext;
  absolutePath: AbsolutePath;
  path: RelativePath;
  fileCreationOrchestrator: FileCreationOrchestrator;
  stats: Stats;
};

export async function createFile({ ctx, absolutePath, path, fileCreationOrchestrator, stats }: TProps) {
  try {
    const uuid = await fileCreationOrchestrator.run({ path, absolutePath, stats });
    const placeholderId = createFilePlaceholderId(uuid);
    virtualDrive.convertToPlaceholder({ itemPath: path, id: placeholderId });
    virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ ctx, path });
      return await createFile({
        ctx,
        absolutePath,
        path,
        fileCreationOrchestrator,
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

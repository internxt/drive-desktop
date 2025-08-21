import { logger } from '@/apps/shared/logger/logger';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { createFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { Stats } from 'fs';
import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { updateFileStatus } from '@/backend/features/local-sync/placeholders/update-file-status';

type TProps = {
  absolutePath: AbsolutePath;
  path: RelativePath;
  fileCreationOrchestrator: FileCreationOrchestrator;
  folderCreator: FolderCreator;
  stats: Stats;
};

export async function createFile({ absolutePath, path, fileCreationOrchestrator, folderCreator, stats }: TProps) {
  try {
    const uuid = await fileCreationOrchestrator.run({ path, absolutePath, stats });
    const placeholderId = createFilePlaceholderId(uuid);
    virtualDrive.convertToPlaceholder({ itemPath: path, id: placeholderId });
    updateFileStatus({ path });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ path, absolutePath, folderCreator });
      return await createFile({
        absolutePath,
        path,
        fileCreationOrchestrator,
        folderCreator,
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

import { logger } from '@/apps/shared/logger/logger';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import VirtualDrive from '@/node-win/virtual-drive';
import { createFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';

type TProps = {
  absolutePath: AbsolutePath;
  path: RelativePath;
  fileCreationOrchestrator: FileCreationOrchestrator;
  folderCreator: FolderCreator;
  virtualDrive: VirtualDrive;
};

export async function createFile({ absolutePath, path, fileCreationOrchestrator, folderCreator, virtualDrive }: TProps) {
  try {
    const uuid = await fileCreationOrchestrator.run({ path, absolutePath });
    const placeholderId = createFilePlaceholderId(uuid);
    virtualDrive.convertToPlaceholder({ itemPath: path, id: placeholderId });
    virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ path, folderCreator });
      return await createFile({ absolutePath, path, fileCreationOrchestrator, folderCreator, virtualDrive });
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

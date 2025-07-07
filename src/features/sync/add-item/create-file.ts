import { logger } from '@/apps/shared/logger/logger';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createParentFolder } from './create-folder';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';

type TProps = {
  absolutePath: AbsolutePath;
  path: RelativePath;
  fileCreationOrchestrator: FileCreationOrchestrator;
  folderCreator: FolderCreator;
};

export async function createFile({ absolutePath, path, fileCreationOrchestrator, folderCreator }: TProps) {
  try {
    return await fileCreationOrchestrator.run({ path, absolutePath });
  } catch (error) {
    if (error instanceof FolderNotFoundError) {
      await createParentFolder({ path, folderCreator });
      return await createFile({ absolutePath, path, fileCreationOrchestrator, folderCreator });
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

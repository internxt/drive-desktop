import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { logger } from '@/apps/shared/logger/logger';
import { createFolder } from '@/features/sync/add-item/create-folder';
import VirtualDrive from '@/node-win/virtual-drive';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from '@/features/sync/add-item/create-file';
import { createFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';

type TProps = {
  path: RelativePath;
  virtualDrive: VirtualDrive;
  isFolder: boolean;
};

export class AddController {
  // Gets called when:
  // - a file has been added
  // - a folder has been added
  // - a file has been saved

  constructor(
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreator,
  ) {}

  async execute({ path, virtualDrive, isFolder }: TProps) {
    if (isFolder) {
      try {
        await createFolder({
          path,
          folderCreator: this.folderCreator,
        });
      } catch (error) {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error in folder creation',
          path,
          error,
        });
      }
    } else {
      try {
        const uuid = await createFile({ path, folderCreator: this.folderCreator, fileCreationOrchestrator: this.fileCreationOrchestrator });
        const placeholderId = createFilePlaceholderId(uuid);
        virtualDrive.convertToPlaceholder({ itemPath: path, id: placeholderId });
        virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: false, sync: true });
      } catch (error) {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error in file creation',
          path,
          error,
        });
      }
    }
  }
}

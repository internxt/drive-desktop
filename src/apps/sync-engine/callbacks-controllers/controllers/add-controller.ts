import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { logger } from '@/apps/shared/logger/logger';
import { createFolder } from '@/features/sync/add-item/create-folder';
import VirtualDrive from '@/node-win/virtual-drive';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from '@/features/sync/add-item/create-file';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { isTemporaryFile } from '@/apps/utils/isTemporalFile';

export class AddController {
  // Gets called when:
  // - a file has been added
  // - a folder has been added
  // - a file has been saved

  constructor(
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreator,
  ) {}

  async createFile({
    absolutePath,
    path,
    virtualDrive,
    size,
  }: {
    absolutePath: AbsolutePath;
    path: RelativePath;
    virtualDrive: VirtualDrive;
    size: number;
  }) {
    try {
      if (size === 0 || size > BucketEntry.MAX_SIZE) {
        /**
         * v2.5.6 Daniel Jiménez
         * TODO: add sync issue
         */
        logger.warn({ tag: 'SYNC-ENGINE', msg: 'Invalid file size', path, size });
        return;
      }

      const tempFile = isTemporaryFile(path);

      if (tempFile) {
        logger.debug({ tag: 'SYNC-ENGINE', msg: 'File is temporary, skipping', path });
        return;
      }

      await createFile({
        absolutePath,
        path,
        folderCreator: this.folderCreator,
        fileCreationOrchestrator: this.fileCreationOrchestrator,
        virtualDrive,
      });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error in file creation', path, error });
    }
  }

  async createFolder({ path }: { path: RelativePath }) {
    try {
      await createFolder({ path, folderCreator: this.folderCreator });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error in folder creation', path, error });
    }
  }
}

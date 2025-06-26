import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { createFilePlaceholderId, FilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker';
import { CallbackController } from './CallbackController';
import { FolderNotFoundError } from '../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';
import { createFolder, createParentFolder } from '@/features/sync/add-item/create-folder';
import VirtualDrive from '@/node-win/virtual-drive';

export class AddController extends CallbackController {
  // Gets called when:
  // - a file has been added
  // - a folder has been added
  // - a file has been saved

  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreator,
  ) {
    super();
  }

  private createFile = async (posixRelativePath: string, attempts = 3): Promise<FilePlaceholderId> => {
    try {
      const uuid = await this.fileCreationOrchestrator.run(posixRelativePath);
      return createFilePlaceholderId(uuid);
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error when adding a file',
        posixRelativePath,
        exc: error,
      });

      if (error instanceof FolderNotFoundError) {
        await createParentFolder({
          posixRelativePath,
          folderCreator: this.folderCreator,
        });
      }

      if (attempts > 0) {
        logger.debug({
          tag: 'SYNC-ENGINE',
          msg: 'Retry creating file',
          posixRelativePath,
          attempts,
        });

        await sleep(2000);
        return this.createFile(posixRelativePath, attempts - 1);
      }

      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Max retries reached',
        posixRelativePath,
      });
    }
  };

  async execute({ absolutePath, drive }: { absolutePath: string; drive: VirtualDrive }) {
    const win32RelativePath = this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath = PlatformPathConverter.winToPosix(win32RelativePath);

    const isFolder = await PathTypeChecker.isFolder(absolutePath);

    if (isFolder) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: '[Is Folder]',
        posixRelativePath,
      });

      try {
        await createFolder({
          posixRelativePath,
          folderCreator: this.folderCreator,
        });
      } catch (error) {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error in folder creation',
          posixRelativePath,
          error,
        });
      }
    } else {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Create file',
        posixRelativePath,
      });

      try {
        const placeholderId = await this.createFile(posixRelativePath);
        drive.convertToPlaceholder({ itemPath: absolutePath, id: placeholderId });
        drive.updateSyncStatus({ itemPath: absolutePath, isDirectory: false, sync: true });
      } catch (error) {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error in file creation',
          posixRelativePath,
          error,
        });
      }
    }
  }
}

import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { createFilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderCreator } from '../../../../context/virtual-drive/folders/application/FolderCreator';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolder } from '../../../../context/virtual-drive/folders/domain/OfflineFolder';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { CallbackController } from './CallbackController';
import { FolderNotFoundError } from '../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';
import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';

export class AddController extends CallbackController {
  // Gets called when:
  // - a file has been added
  // - a folder has been added
  // - a file has been saved
  // - after a file has been moved to a folder

  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreator,
    private readonly offlineFolderCreator: OfflineFolderCreator,
  ) {
    super();
  }

  private createFile = async (posixRelativePath: string, attempts = 3): Promise<string> => {
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
        await this.createFolderFather(posixRelativePath);
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

  private createFolder = async (offlineFolder: OfflineFolder, attempts = 3): Promise<string> => {
    try {
      await this.folderCreator.run(offlineFolder);
      return createFilePlaceholderId(offlineFolder.uuid);
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating folder',
        path: offlineFolder.path,
        exc: error,
      });

      if (attempts > 0) {
        logger.info({
          tag: 'SYNC-ENGINE',
          msg: 'Retry creating folder',
          path: offlineFolder.path,
          attempts,
        });

        await sleep(2000);
        return this.createFolder(offlineFolder, attempts - 1);
      }

      throw logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Max retries reached',
        path: offlineFolder.path,
      });
    }
  };

  private runFolderCreator(posixRelativePath: string): Promise<Folder> {
    const offlineFolder = this.offlineFolderCreator.run(posixRelativePath);
    return this.folderCreator.run(offlineFolder);
  }

  private async createFolderFather(posixRelativePath: string) {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Creating folder father',
      posixRelativePath,
    });

    const posixDir = PlatformPathConverter.getFatherPathPosix(posixRelativePath);

    try {
      await sleep(1000);
      await this.runFolderCreator(posixDir);
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating folder father creation',
        posixDir,
        exc: error,
      });

      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixDir);
        // child created
        await this.runFolderCreator(posixDir);
      } else {
        throw error;
      }
    }
  }

  private async createOfflineFolder(posixRelativePath: string): Promise<OfflineFolder> {
    try {
      return this.offlineFolderCreator.run(posixRelativePath);
    } catch (error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error creating offline folder',
        posixRelativePath,
        exc: error,
      });
      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixRelativePath);
        // child created
        return this.createOfflineFolder(posixRelativePath);
      } else {
        throw error;
      }
    }
  }

  async execute(absolutePath: string): Promise<string | undefined> {
    const win32RelativePath = this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath = PlatformPathConverter.winToPosix(win32RelativePath);

    const isFolder = await PathTypeChecker.isFolder(absolutePath);

    if (isFolder) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: '[Is Folder]', posixRelativePath });

      try {
        const offlineFolder = await this.createOfflineFolder(posixRelativePath);
        return await this.createFolder(offlineFolder);
      } catch (error) {
        logger.error({ tag: 'SYNC-ENGINE', msg: '[folder creation] Error captured:', error });
      }
    } else {
      logger.debug({ tag: 'SYNC-ENGINE', msg: '[Is File]', posixRelativePath });

      try {
        return await this.createFile(posixRelativePath);
      } catch (error) {
        logger.error({ tag: 'SYNC-ENGINE', msg: '[file creation] Error captured:', error });
      }
    }
  }
}

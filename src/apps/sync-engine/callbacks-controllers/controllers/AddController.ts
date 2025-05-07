import Logger from 'electron-log';
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
import * as Sentry from '@sentry/electron/renderer';
export class AddController extends CallbackController {
  // Gets called when:
  //  - a file has been added
  //  -a file has been saved
  //  - after a file has been moved to a folder

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
    } catch (error: unknown) {
      Logger.error('Error when adding a file: ' + posixRelativePath, error);
      Sentry.captureException(error);
      if (error instanceof FolderNotFoundError) {
        await this.createFolderFather(posixRelativePath);
      }
      if (attempts > 0) {
        Logger.info('[Creating file]', 'retrying...', attempts);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.createFile(posixRelativePath, attempts - 1);
      }
      Logger.error('[Creating file]', 'Max retries reached', 'callback emited');
      Sentry.captureException(error);
      throw error;
    }
  };

  private createFolder = async (offlineFolder: OfflineFolder, attempts = 3): Promise<string> => {
    try {
      await this.folderCreator.run(offlineFolder);
      return createFilePlaceholderId(offlineFolder.uuid);
    } catch (error: unknown) {
      Logger.error('Error creating folder', error);
      Sentry.captureException(error);
      if (attempts > 0) {
        Logger.info('[Creating folder]', 'retrying...', attempts);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.createFolder(offlineFolder, attempts - 1);
      }
      Logger.error('[Creating folder]', 'Max retries reached', 'callback emited');
      Sentry.captureException(error);
      throw error;
    }
  };
  private runFolderCreator(posixRelativePath: string): Promise<Folder> {
    const offlineFolder = this.offlineFolderCreator.run(posixRelativePath);
    return this.folderCreator.run(offlineFolder);
  }

  private async createFolderFather(posixRelativePath: string) {
    Logger.info('posixRelativePath', posixRelativePath);
    const posixDir = PlatformPathConverter.getFatherPathPosix(posixRelativePath);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.runFolderCreator(posixDir);
    } catch (error) {
      Logger.error('Error creating folder father creation:', error);
      Sentry.captureException(error);
      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixDir);
        // child created
        await this.runFolderCreator(posixDir);
      } else {
        Logger.error('Error creating folder father creation inside catch:', error);
        Sentry.captureException(error);
        throw error;
      }
    }
  }

  private async createOfflineFolder(posixRelativePath: string): Promise<OfflineFolder> {
    try {
      return this.offlineFolderCreator.run(posixRelativePath);
    } catch (error) {
      Logger.error('Error creating offline folder:', posixRelativePath, 'Error: ', error);
      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixRelativePath);
        // child created
        return this.createOfflineFolder(posixRelativePath);
      } else {
        Logger.error('Error creating offline folder:', error);
        Sentry.captureException(error);
        throw error;
      }
    }
  }

  async execute(absolutePath: string): Promise<string | undefined> {
    const win32RelativePath = this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath = PlatformPathConverter.winToPosix(win32RelativePath);

    const isFolder = await PathTypeChecker.isFolder(absolutePath);
    const attempts = 3;
    if (isFolder) {
      Logger.debug('[Is Folder]', posixRelativePath);
      let offlineFolder: OfflineFolder;
      try {
        offlineFolder = await this.createOfflineFolder(posixRelativePath);
        return await this.createFolder(offlineFolder, attempts);
      } catch (error) {
        Logger.error('[folder creation] Error captured:', error);
        Sentry.captureException(error);
        return;
      }
    } else {
      Logger.debug('[Is File]', posixRelativePath);
      try {
        return await this.createFile(posixRelativePath, attempts);
      } catch (error) {
        Logger.error('[file creation] Error captured:', error);
        Sentry.captureException(error);
        return;
      }
    }
  }
}

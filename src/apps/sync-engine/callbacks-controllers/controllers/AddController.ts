import Logger from 'electron-log';
import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { createFilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderCreatorFromOfflineFolder } from '../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { createFolderPlaceholderId } from '../../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { OfflineFolder } from '../../../../context/virtual-drive/folders/domain/OfflineFolder';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { CallbackController } from './CallbackController';
import { FolderNotFoundError } from '../../../../context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';

type CreationCallback = (acknowledge: boolean, id: string) => void;

export class AddController extends CallbackController {
  // Gets called when:
  //  - a file has been added
  //  -a file has been saved
  //  - after a file has been moved to a folder

  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreatorFromOfflineFolder,
    private readonly offlineFolderCreator: OfflineFolderCreator
  ) {
    super();
  }

  private createFile = async (
    posixRelativePath: string,
    callback: (acknowledge: boolean, id: string) => void,
    attempts = 3
  ) => {
    try {
      const contentsId = await this.fileCreationOrchestrator.run(
        posixRelativePath
      );
      callback(true, createFilePlaceholderId(contentsId));
    } catch (error: unknown) {
      Logger.error('Error when adding a file: ' + posixRelativePath, error);
      if (error instanceof FolderNotFoundError) {
        await this.createFolderFather(posixRelativePath);
      }
      if (attempts > 0) {
        Logger.info('[Creating file]', 'retrying...', attempts);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.createFile(posixRelativePath, callback, attempts - 1);
        return;
      }
      Logger.error('[Creating file]', 'Max retries reached', 'callback emited');
      callback(false, '');
    }
  };

  private createFolder = async (
    offlineFolder: OfflineFolder,
    callback: (acknowledge: boolean, id: string) => void,
    attempts = 3
  ) => {
    try {
      await this.folderCreator.run(offlineFolder);
      callback(true, createFolderPlaceholderId(offlineFolder.uuid));
    } catch (error: unknown) {
      Logger.error('Error creating folder', error);
      if (attempts > 0) {
        Logger.info('[Creating folder]', 'retrying...', attempts);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.createFolder(offlineFolder, callback, attempts - 1);
        return;
      }
      Logger.error(
        '[Creating folder]',
        'Max retries reached',
        'callback emited'
      );
      throw error;
    }
  };
  private async runFolderCreator(posixRelativePath: string): Promise<Folder> {
    const offlineFolder = this.offlineFolderCreator.run(posixRelativePath);
    return this.folderCreator.run(offlineFolder);
  }

  private async createFolderFather(posixRelativePath: string) {
    Logger.info('posixRelativePath', posixRelativePath);
    const posixDir =
      PlatformPathConverter.getFatherPathPosix(posixRelativePath);
    try {
      await this.runFolderCreator(posixDir);
    } catch (error) {
      Logger.error('Error creating folder father creation:', error);
      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixDir);
        // child created
        await this.runFolderCreator(posixDir);
      } else {
        Logger.error(
          'Error creating folder father creation inside catch:',
          error
        );
        throw error;
      }
    }
  }

  private async createOfflineFolder(
    posixRelativePath: string
  ): Promise<OfflineFolder> {
    try {
      return this.offlineFolderCreator.run(posixRelativePath);
    } catch (error) {
      if (error instanceof FolderNotFoundError) {
        // father created
        await this.createFolderFather(posixRelativePath);
        // child created
        return this.createOfflineFolder(posixRelativePath);
      } else {
        Logger.error('Error creating offline folder:', error);
        throw error;
      }
    }
  }

  async execute(
    absolutePath: string,
    callback: CreationCallback
  ): Promise<void> {
    const win32RelativePath =
      this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath =
      PlatformPathConverter.winToPosix(win32RelativePath);

    const isFolder = await PathTypeChecker.isFolder(absolutePath);
    const attempts = 3;
    if (isFolder) {
      Logger.debug('[Is Folder]', posixRelativePath);
      let offlineFolder: OfflineFolder;
      try {
        offlineFolder = await this.createOfflineFolder(posixRelativePath);
        await this.createFolder(offlineFolder, callback, attempts);
      } catch (error) {
        Logger.error('[folder creation] Error captured:', error);
        callback(false, '');
      }
    } else {
      Logger.debug('[Is File]', posixRelativePath);
      try {
        await this.createFile(posixRelativePath, callback, attempts);
      } catch (error) {
        Logger.error('[file creation] Error captured:', error);
        callback(false, '');
      }
    }
  }
}

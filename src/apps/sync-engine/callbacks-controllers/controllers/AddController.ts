import Logger from 'electron-log';
import { FileCreationOrchestrator } from '../../../../context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { createFilePlaceholderId } from '../../../../context/virtual-drive/files/domain/PlaceholderId';
import { FolderCreatorFromOfflineFolder } from '../../../../context/virtual-drive/folders/application/FolderCreatorFromOfflineFolder';
import { OfflineFolderCreator } from '../../../../context/virtual-drive/folders/application/Offline/OfflineFolderCreator';
import { createFolderPlaceholderId } from '../../../../context/virtual-drive/folders/domain/FolderPlaceholderId';
import { OfflineFolder } from '../../../../context/virtual-drive/folders/domain/OfflineFolder';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { MapObserver } from '../../../../context/virtual-drive/shared/domain/MapObserver';
import { PathTypeChecker } from '../../../shared/fs/PathTypeChecker ';
import { CallbackController } from './CallbackController';

type FileCreationQueue = Map<
  string,
  (acknowledge: boolean, id: string) => void
>;
type FolderCreationQueue = Map<
  OfflineFolder,
  (acknowledge: boolean, id: string) => void
>;
type CreationCallback = (acknowledge: boolean, id: string) => void;

export class AddController extends CallbackController {
  // Gets called when:
  //  - a file has been added
  //  -a file has been saved
  //  - after a file has been moved to a folder

  private readonly filesQueue: FileCreationQueue;
  private readonly foldersQueue: FolderCreationQueue;

  private readonly observer: MapObserver;

  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreatorFromOfflineFolder,
    private readonly offlineFolderCreator: OfflineFolderCreator
  ) {
    super();

    this.filesQueue = new Map();
    this.foldersQueue = new Map();

    this.observer = new MapObserver(this.foldersQueue, this.createFiles);
    this.observer.startObserving();
  }

  private createFile = async (
    posixRelativePath: string,
    callback: (acknowledge: boolean, id: string) => void
  ) => {
    try {
      const contentsId = await this.fileCreationOrchestrator.run(
        posixRelativePath
      );
      return callback(true, createFilePlaceholderId(contentsId));
    } catch (error: unknown) {
      Logger.error('Error when adding a file: ', error);
      callback(false, '');
    } finally {
      this.filesQueue.delete(posixRelativePath);
    }
  };

  private createFiles = async () => {
    for (const [posixRelativePath, callback] of this.filesQueue) {
      await this.createFile(posixRelativePath, callback);
    }
  };

  private createFolders = async () => {
    Logger.debug('FOLDERS TO CREATE', this.foldersQueue.size);
    for (const [offlineFolder, callback] of this.foldersQueue) {
      await this.createFolder(offlineFolder, callback);
    }
  };

  private createFolder = async (
    offlineFolder: OfflineFolder,
    callback: (acknowledge: boolean, id: string) => void
  ) => {
    Logger.info('Creating folder', offlineFolder);
    try {
      await this.folderCreator.run(offlineFolder);
    } catch (error: unknown) {
      Logger.error('Error creating a folder: ', error);
      callback(false, '');
    } finally {
      this.foldersQueue.delete(offlineFolder);
    }
  };

  private enqueueFolder = (
    posixRelativePath: string,
    callback: CreationCallback
  ) => {
    try {
      const offlineFolder = this.offlineFolderCreator.run(posixRelativePath);
      callback(true, createFolderPlaceholderId(offlineFolder.uuid));
      this.foldersQueue.set(offlineFolder, () => {
        //no-op
      });
    } catch (error: unknown) {
      Logger.error('Error on folder creation: ', error);
      callback(false, '');
    }
  };

  async execute(
    absolutePath: string,
    callback: CreationCallback
  ): Promise<void> {
    const win32RelativePath =
      this.absolutePathToRelativeConverter.run(absolutePath);

    const posixRelativePath =
      PlatformPathConverter.winToPosix(win32RelativePath);

    const isFolder = await PathTypeChecker.isFolder(absolutePath);

    if (isFolder) {
      this.enqueueFolder(posixRelativePath, callback);
      await this.createFolders();
      await this.createFiles();
      return;
    }

    this.filesQueue.set(posixRelativePath, callback);

    if (this.foldersQueue.size === 0) {
      Logger.debug(
        'File is not going to be queued. Creating...',
        posixRelativePath
      );
      await this.createFiles();
    } else {
      Logger.debug('File has been queued: ', posixRelativePath);
    }
  }
}

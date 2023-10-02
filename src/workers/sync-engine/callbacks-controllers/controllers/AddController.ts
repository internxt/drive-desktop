import Logger from 'electron-log';
import { CallbackController } from './CallbackController';
import { rawPathIsFolder } from '../helpers/rawPathIsFolder';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { MapObserver } from '../../modules/shared/domain/MapObserver';
import { FileCreationOrchestrator } from '../../modules/boundaryBridge/application/FileCreationOrchestrator';
import { createFolderPlaceholderId } from '../../modules/placeholders/domain/FolderPlaceholderId';
import { createFilePlaceholderId } from '../../modules/placeholders/domain/FilePlaceholderId';
import { OfflineFolderCreator } from '../../modules/folders/application/Offline/OfflineFolderCreator';
import { OfflineFolder } from 'workers/sync-engine/modules/folders/domain/OfflineFolder';

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
  private readonly filesQueue: FileCreationQueue;
  private readonly foldersQueue: FolderCreationQueue;

  private readonly observer: MapObserver;

  constructor(
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreator,
    private readonly offlineFolderCreator: OfflineFolderCreator
  ) {
    super();

    this.filesQueue = new Map();
    this.foldersQueue = new Map();

    this.observer = new MapObserver(this.foldersQueue, this.createFiles);
    this.observer.startObserving();
  }

  private createFile = async (
    absolutePath: string,
    callback: (acknowledge: boolean, id: string) => void
  ) => {
    try {
      const contentsId = await this.fileCreationOrchestrator.run(absolutePath);
      return callback(true, contentsId);
    } catch (error: unknown) {
      Logger.error('Error when adding a file: ', error);
      callback(false, '');
    } finally {
      this.filesQueue.delete(absolutePath);
    }
  };

  private createFiles = async () => {
    for (const [absolutePath, callback] of this.filesQueue) {
      await this.createFile(absolutePath, callback);
    }
  };

  private createFolders = async () => {
    for (const [absolutePath, callback] of this.foldersQueue) {
      await this.createFolder(absolutePath, callback);
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
    absolutePath: string,
    callback: CreationCallback
  ) => {
    const offlineFolder = this.offlineFolderCreator.run(absolutePath);
    callback(true, offlineFolder.uuid);
    this.foldersQueue.set(offlineFolder, () => {});
  };

  async execute(
    absolutePath: string,
    callback: CreationCallback
  ): Promise<void> {
    if (rawPathIsFolder(absolutePath)) {
      this.enqueueFolder(absolutePath, callback);
      await this.createFolders();
      return;
    }

    this.filesQueue.set(absolutePath, callback);

    if (this.foldersQueue.size === 0) {
      Logger.debug('File is not going to be queued. Creating...', absolutePath);
      this.createFiles();
    } else {
      Logger.debug('File has been queued: ', absolutePath);
    }
  }
}

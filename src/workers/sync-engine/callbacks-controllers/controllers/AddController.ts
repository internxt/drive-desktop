import Logger from 'electron-log';
import { CallbackController } from './CallbackController';
import { rawPathIsFolder } from '../helpers/rawPathIsFolder';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { MapObserver } from 'workers/sync-engine/modules/shared/domain/MapObserver';
import { FileCreationOrchestrator } from 'workers/sync-engine/modules/boundaryBridge/application/FileCreationOrchestrator';

type Queue = Map<string, (acknowledge: boolean, id: string) => void>;

export class AddController extends CallbackController {
  private readonly filesQueue: Queue;
  private readonly foldersQueue: Queue;

  private readonly observer: MapObserver;

  constructor(
    private readonly fileCreationOrchestrator: FileCreationOrchestrator,
    private readonly folderCreator: FolderCreator
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
    absolutePath: string,
    callback: (acknowledge: boolean, id: string) => void
  ) => {
    Logger.info('Creating folder', absolutePath);
    try {
      const folder = await this.folderCreator.run(absolutePath);
      callback(true, folder.uuid);
    } catch (error: unknown) {
      Logger.error('Error creating a folder: ', error);
      callback(false, '');
    } finally {
      this.foldersQueue.delete(absolutePath);
    }
  };

  async execute(
    absolutePath: string,
    callback: (acknowledge: boolean, id: string) => void
  ): Promise<void> {
    if (rawPathIsFolder(absolutePath)) {
      this.foldersQueue.set(absolutePath, callback);
      await this.createFolders();
      return;
    }

    Logger.debug('File is going to be queued: ', absolutePath);
    this.filesQueue.set(absolutePath, callback);
    if (this.foldersQueue.size === 0) {
      this.createFiles();
    }
  }
}

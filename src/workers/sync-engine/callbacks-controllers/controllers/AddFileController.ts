import Logger from 'electron-log';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { CallbackController } from './CallbackController';
import { RetryContentsUploader } from '../../modules/contents/application/RetryContentsUploader';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { PlatformPathConverter } from '../../modules/shared/test/helpers/PlatformPathConverter';
import { rawPathIsFolder } from '../helpers/rawPathIsFolder';
import { FolderCreator } from '../../modules/folders/application/FolderCreator';
import { MapObserver } from 'workers/sync-engine/modules/shared/domain/MapObserver';
import { FolderFinder } from 'workers/sync-engine/modules/folders/application/FolderFinder';

type Queue = Map<string, (acknowledge: boolean, id: string) => void>;

export class AddFileController extends CallbackController {
  private readonly filesQueue: Queue;
  private readonly foldersQueue: Queue;

  private readonly observer: MapObserver;

  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileCreator: FileCreator,
    private readonly fileDeleter: FileDeleter,
    private readonly searchByPartial: FileByPartialSearcher,
    private readonly folderCreator: FolderCreator,
    private readonly folderFinder: FolderFinder
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
      const path = this.filePathFromAbsolutePathCreator.run(absolutePath);
      const file = this.searchByPartial.run({
        path: PlatformPathConverter.winToPosix(path.value),
      });

      this.folderFinder.findFromFilePath(path);

      const fileContents = await this.contentsUploader.run(absolutePath);

      if (file) {
        Logger.info('File already exists, deleting previous one');
        await this.fileDeleter.run(file.contentsId);
        Logger.info('Previous file deleted');
      }

      Logger.info('Creating new file');

      const newFile = await this.fileCreator.run(path, fileContents);
      Logger.info('File added successfully');

      return callback(true, newFile.contentsId);
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

  private createFolders = async () => {
    for (const [absolutePath, callback] of this.foldersQueue) {
      await this.createFolder(absolutePath, callback);
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

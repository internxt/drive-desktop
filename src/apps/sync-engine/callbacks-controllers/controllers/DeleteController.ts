import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { RetryFolderDeleter } from '../../../../context/virtual-drive/folders/application/RetryFolderDeleter';
import { DelayQueue } from '../../../../context/virtual-drive/shared/domain/DelayQueue';
import { CallbackController } from './CallbackController';
import Logger from 'electron-log';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import * as Sentry from '@sentry/electron/renderer';
export class DeleteController extends CallbackController {
  private readonly filesQueue: DelayQueue;
  private readonly foldersQueue: DelayQueue;

  constructor(
    private readonly fileDeleter: FileDeleter,
    private readonly retryFolderDeleter: RetryFolderDeleter,
    private readonly fileFolderContainerDetector: FileFolderContainerDetector,
    private readonly folderContainerDetector: FolderContainerDetector,
  ) {
    super();

    const deleteFile = async (file: string) => {
      await this.fileDeleter.run(file);
    };

    const deleteFolder = async (folder: string) => {
      try {
        await this.retryFolderDeleter.run(folder);
      } catch (error) {
        Logger.error('Error deleting folder: ', error);
        Sentry.captureException(error);
        // TODO: create tree of placeholders that are not deleted
      }
    };

    const canDeleteFolders = () => {
      // Folders can always be deleted
      return true;
    };

    this.foldersQueue = new DelayQueue('folders', deleteFolder, canDeleteFolders);

    const canDeleteFiles = () => {
      return this.foldersQueue.isEmpty;
    };

    this.filesQueue = new DelayQueue('files', deleteFile, canDeleteFiles);
  }

  async execute(placeholderId: string) {
    const trimmedId = this.trim(placeholderId);

    if (this.isFilePlaceholder(trimmedId)) {
      const [_, placeholderId] = trimmedId.split(':');
      Logger.debug(`Adding file: ${placeholderId} to the trash queue`);
      this.filesQueue.push(placeholderId);
      return;
    }

    if (this.isFolderPlaceholder(trimmedId)) {
      const [_, folderUuid] = trimmedId.split(':');
      Logger.debug(`Adding folder: ${folderUuid} to the trash queue`);
      this.CleanQueuesByFolder(folderUuid);
      this.foldersQueue.push(folderUuid);
      return;
    }

    throw new Error(`Placeholder Id not identified:  ${trimmedId}`);
  }

  private CleanQueuesByFolder(folderUuid: Folder['uuid']) {
    // always remove files from the filesQueue if a folder is added
    this.CleanQueueFile(folderUuid);
    // remove child folders from the queue if a parent folder exists
    this.CleanQueueFolder(folderUuid);
  }

  private CleanQueueFile(folderUuid: Folder['uuid']) {
    const files = this.filesQueue.values;
    const filesToDelete = files.filter((file) => this.fileFolderContainerDetector.run(file, folderUuid));
    filesToDelete.forEach((file) => {
      this.filesQueue.removeOne(file);
    });
  }

  private CleanQueueFolder(folderUuid: Folder['uuid']) {
    const reversedFolders = this.foldersQueue.reversedValues;
    reversedFolders.forEach((folder) => {
      const isParentFolder = this.folderContainerDetector.run(folder, folderUuid);
      if (isParentFolder) {
        this.foldersQueue.removeOne(folder);
      }
    });
  }
}

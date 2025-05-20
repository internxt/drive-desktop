import { FileDeleter } from '../../../../context/virtual-drive/files/application/FileDeleter';
import { DelayQueue } from '../../../../context/virtual-drive/shared/domain/DelayQueue';
import { CallbackController } from './CallbackController';
import { FileFolderContainerDetector } from '../../../../context/virtual-drive/files/application/FileFolderContainerDetector';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';
import { FolderContainerDetector } from '../../../../context/virtual-drive/folders/application/FolderContainerDetector';
import { FolderDeleter } from '@/context/virtual-drive/folders/application/FolderDeleter';
import { logger } from '@/apps/shared/logger/logger';

export class DeleteController extends CallbackController {
  private readonly filesQueue: DelayQueue;
  private readonly foldersQueue: DelayQueue;

  constructor(
    private readonly fileDeleter: FileDeleter,
    private readonly folderDeleter: FolderDeleter,
    private readonly fileFolderContainerDetector: FileFolderContainerDetector,
    private readonly folderContainerDetector: FolderContainerDetector,
  ) {
    super();

    const deleteFile = async (file: string) => {
      try {
        await this.fileDeleter.run(file);
      } catch (exc) {
        logger.error({ msg: 'Error deleting file', exc });
      }
    };

    const deleteFolder = async (folder: string) => {
      try {
        await this.folderDeleter.run(folder);
      } catch (exc) {
        logger.error({ msg: 'Error deleting folder', exc });
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

  execute(placeholderId: string) {
    const trimmedId = this.trim(placeholderId);
    const uuid = trimmedId.split(':')[1];

    if (this.isFilePlaceholder(trimmedId)) {
      logger.debug({ msg: 'Adding file to the trash queue', uuid });
      this.filesQueue.push(uuid);
    } else if (this.isFolderPlaceholder(trimmedId)) {
      logger.debug({ msg: 'Adding folder to the trash queue', uuid });
      this.CleanQueuesByFolder(uuid);
      this.foldersQueue.push(uuid);
    } else {
      throw logger.error({ msg: 'PlaceholderId not identified', trimmedId });
    }
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

import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { CallbackController } from './CallbackController';
import Logger from 'electron-log';
import { DelayQueue } from 'workers/sync-engine/modules/shared/domain/DelayQueue';

export class DeleteController extends CallbackController {
  private readonly filesQueue: DelayQueue;
  private readonly foldersQueue: DelayQueue;

  constructor(
    private readonly fileDeleter: FileDeleter,
    private readonly folderDeleter: FolderDeleter
  ) {
    super();

    const deleteFile = async (file: string) => {
      Logger.debug('Deleting queued files');
      this.fileDeleter.run(file);
      Logger.debug('Queued files deleted');
    };

    const deleteFolder = async (folder: string) => {
      Logger.debug('Deleting queued folders');
      this.folderDeleter.run(folder);
      Logger.debug('Queued folders deleted');
    };

    const canDeleteFolders = () => {
      // Folders can always be deleted
      return true;
    };

    this.foldersQueue = new DelayQueue(
      'folders',
      deleteFolder,
      canDeleteFolders
    );

    const canDeleteFiles = () => {
      // Files cannot be deleted if there are folders on the queue
      return this.foldersQueue.size === 0;
    };

    this.filesQueue = new DelayQueue('files', deleteFile, canDeleteFiles);
  }

  async execute(contentsId: string) {
    const trimmedId = this.trim(contentsId);

    // TODO: need a better way to detect if its a file or a folder
    if (trimmedId.length === 24) {
      this.filesQueue.push(trimmedId);
      return;
    }

    this.foldersQueue.push(trimmedId);
  }
}

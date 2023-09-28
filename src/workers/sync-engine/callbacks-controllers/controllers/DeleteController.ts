import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { CallbackController } from './CallbackController';
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
      await this.fileDeleter.run(file);
    };

    const deleteFolder = async (folder: string) => {
      await this.folderDeleter.run(folder);
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

    if (this.isContentsId(trimmedId)) {
      this.filesQueue.push(trimmedId);
      return;
    }

    this.foldersQueue.push(trimmedId);
  }
}

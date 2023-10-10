import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { CallbackController } from './CallbackController';
import { DelayQueue } from 'workers/sync-engine/modules/shared/domain/DelayQueue';
import Logger from 'electron-log';

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

    if (this.isFilePlaceholder(trimmedId)) {
      const [_, contentsId] = trimmedId.split(':');
      Logger.debug(`Adding file: ${contentsId} to the trash queue`);
      this.filesQueue.push(contentsId);
      return;
    }

    if (this.isFolderPlaceholder(trimmedId)) {
      const [_, folderUuid] = trimmedId.split(':');
      Logger.debug(`Adding folder: ${folderUuid} to the trash queue`);
      this.foldersQueue.push(folderUuid);
      return;
    }

    throw new Error(`Placeholder Id not identified:  ${trimmedId}`);
  }
}

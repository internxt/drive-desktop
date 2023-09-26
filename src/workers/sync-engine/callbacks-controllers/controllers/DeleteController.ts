import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { CallbackController } from './CallbackController';
import Logger from 'electron-log';
import { DelayQueue } from 'workers/sync-engine/modules/shared/domain/DelayQueue';

export class DeleteController extends CallbackController {
  private readonly filesQueue: DelayQueue;
  private readonly foldersQueue: Map<string, void>;

  constructor(
    private readonly fileDeleter: FileDeleter,
    private readonly folderDeleter: FolderDeleter
  ) {
    super();

    this.foldersQueue = new Map();

    const deleteAllFiles = async (files: Array<string>) => {
      Logger.debug('Deleting queued files');
      await Promise.all(files.map((f) => this.fileDeleter.run(f)));
      Logger.debug('Queued files deleted');
    };

    const canDelete = () => {
      return this.foldersQueue.size === 0;
    };

    this.filesQueue = new DelayQueue(deleteAllFiles, canDelete);
  }

  private async deleteFolder(uuid: string) {
    Logger.debug('Deleting folder');
    await this.folderDeleter.run(uuid);
    Logger.debug('Folder deleted');
  }

  async execute(contentsId: string) {
    const trimmedId = this.trim(contentsId);

    if (trimmedId.length === 24) {
      this.filesQueue.push(trimmedId);
      return;
    }

    this.foldersQueue.set(trimmedId);
    await this.deleteFolder(trimmedId);
    this.foldersQueue.delete(trimmedId);
    return;
  }
}

import { FolderDeleter } from 'workers/sync-engine/modules/folders/application/FolderDeleter';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { CallbackController } from './CallbackController';
import Logger from 'electron-log';

export class DeleteFileController extends CallbackController {
  constructor(
    private readonly fileDeleter: FileDeleter,
    private readonly folderDeleter: FolderDeleter
  ) {
    super();
  }

  private async deleteFile(id: string) {
    Logger.debug('Deleting file');
    await this.fileDeleter.run(id);
    Logger.debug('file deleted');
  }

  private async deleteFolder(uuid: string) {
    Logger.debug('Deleting folder');
    await this.folderDeleter.run(uuid);
    Logger.debug('Folder deleted');
  }

  async execute(contentsId: string) {
    const trimmedId = this.trim(contentsId);

    if (trimmedId.length === 24) {
      await this.deleteFile(trimmedId);
      return;
    }

    await this.deleteFolder(trimmedId);
    return;
  }
}

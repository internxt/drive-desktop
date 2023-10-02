import { OfflineFolderPathUpdater } from 'workers/sync-engine/modules/folders/application/Offline/OfflineFolderPathUpdater';
import { CallbackController } from '../CallbackController';
import Logger from 'electron-log';

export class OfflineRenameOrMoveController extends CallbackController {
  constructor(private readonly folderPathUpdater: OfflineFolderPathUpdater) {
    super();
  }

  async execute(
    absolutePath: string,
    placeholderId: string,
    callback: (response: boolean) => void
  ) {
    Logger.warn('Inside the fallback');
    const trimmedId = this.trim(placeholderId);

    try {
      if (absolutePath.startsWith('\\$Recycle.Bin')) {
        return callback(false);
      }

      if (this.isFilePlaceholder(trimmedId)) {
        return callback(false);
      }
      Logger.debug('absolute path', absolutePath);
      await this.folderPathUpdater.run(trimmedId, absolutePath);
      callback(true);
    } catch (error: unknown) {
      Logger.error(error);
      callback(false);
    }
  }
}

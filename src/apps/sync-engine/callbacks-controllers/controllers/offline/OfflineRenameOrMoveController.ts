import Logger from 'electron-log';
import { OfflineFolderPathUpdater } from '../../../../../context/virtual-drive/folders/application/Offline/OfflineFolderPathUpdater';
import { AbsolutePathToRelativeConverter } from '../../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { CallbackController } from '../CallbackController';

export class OfflineRenameOrMoveController extends CallbackController {
  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly folderPathUpdater: OfflineFolderPathUpdater
  ) {
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

      const win32RelativePath =
        this.absolutePathToRelativeConverter.run(absolutePath);

      const posixRelativePath =
        PlatformPathConverter.winToPosix(win32RelativePath);

      if (this.isFilePlaceholder(trimmedId)) {
        Logger.error('Tried to rename or move an offline file');
        return callback(false);
      }

      if (this.isFolderPlaceholder(trimmedId)) {
        const [_, folderUuid] = trimmedId.split(':');
        await this.folderPathUpdater.run(folderUuid, posixRelativePath);
        Logger.debug('OFFLINE FOLDER PATH UPDATED: ', folderUuid);
        return callback(true);
      }

      Logger.error('Placeholder id not identified: ', trimmedId);
      callback(false);
    } catch (error: unknown) {
      Logger.error(error);
      callback(false);
    }
  }
}

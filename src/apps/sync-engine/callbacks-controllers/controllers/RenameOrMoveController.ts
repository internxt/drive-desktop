import { FilePathUpdater } from '../../../../context/virtual-drive/files/application/FilePathUpdater';
import { FolderPathUpdater } from '../../../../context/virtual-drive/folders/application/FolderPathUpdater';
import { AbsolutePathToRelativeConverter } from '../../../../context/virtual-drive/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from '../../../../context/virtual-drive/shared/application/PlatformPathConverter';
import { CallbackController } from './CallbackController';
import { DeleteController } from './DeleteController';
import Logger from 'electron-log';

export class RenameOrMoveController extends CallbackController {
  constructor(
    private readonly absolutePathToRelativeConverter: AbsolutePathToRelativeConverter,
    private readonly filePathUpdater: FilePathUpdater,
    private readonly folderPathUpdater: FolderPathUpdater,
    private readonly deleteController: DeleteController
  ) {
    super();
  }

  async execute(
    absolutePath: string,
    contentsId: string,
    callback: (response: boolean) => void
  ) {
    const trimmedId = this.trim(contentsId);

    try {
      if (absolutePath.startsWith('\\$Recycle.Bin')) {
        await this.deleteController.execute(trimmedId);
        return callback(true);
      }

      const win32RelativePath =
        this.absolutePathToRelativeConverter.run(absolutePath);

      const posixRelativePath =
        PlatformPathConverter.winToPosix(win32RelativePath);

      if (this.isFilePlaceholder(trimmedId)) {
        const [_, contentsId] = trimmedId.split(':');
        await this.filePathUpdater.run(contentsId, posixRelativePath);
        return callback(true);
      }

      if (this.isFolderPlaceholder(trimmedId)) {
        const [_, folderUuid] = trimmedId.split(':');
        await this.folderPathUpdater.run(folderUuid, posixRelativePath);
        return callback(true);
      }

      Logger.error('Unidentified placeholder id: ', trimmedId);
      callback(false);
    } catch (error: unknown) {
      Logger.error(error);
      callback(false);
    }
  }
}

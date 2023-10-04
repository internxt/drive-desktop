import { FolderPathUpdater } from '../../modules/folders/application/FolderPathUpdater';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { CallbackController } from './CallbackController';
import { DeleteController } from './DeleteController';
import Logger from 'electron-log';

export class RenameOrMoveController extends CallbackController {
  constructor(
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
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

      const relative = this.filePathFromAbsolutePathCreator.run(absolutePath);

      if (this.isFilePlaceholder(trimmedId)) {
        const [_, contentsId] = trimmedId.split(':');
        await this.filePathUpdater.run(contentsId, relative);
        return callback(true);
      }

      if (this.isFolderPlaceholder(trimmedId)) {
        const [_, folderUuid] = trimmedId.split(':');
        await this.folderPathUpdater.run(folderUuid, absolutePath);
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

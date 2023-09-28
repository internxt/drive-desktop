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

      if (this.isContentsId(trimmedId)) {
        await this.filePathUpdater.run(trimmedId, relative);
        return callback(true);
      }

      await this.folderPathUpdater.run(trimmedId, absolutePath);
      callback(true);
    } catch (error: unknown) {
      Logger.error(error);
      callback(false);
    }
  }
}

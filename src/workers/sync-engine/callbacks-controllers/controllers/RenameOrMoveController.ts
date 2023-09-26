import { FileDeleter } from 'workers/sync-engine/modules/files/application/FileDeleter';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { CallbackController } from './CallbackController';
import { DeleteController } from './DeleteController';

export class RenameOrMoveController extends CallbackController {
  constructor(
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly filePathUpdater: FilePathUpdater,
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
        callback(true);
        return;
      }

      const relative = this.filePathFromAbsolutePathCreator.run(absolutePath);

      await this.filePathUpdater.run(trimmedId, relative);
      callback(true);
    } catch (error: unknown) {
      callback(false);
    }
  }
}
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';
import { CallbackController } from './CallbackController';

export class RenameOrMoveController extends CallbackController {
  constructor(
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly filePathUpdater: FilePathUpdater
  ) {
    super();
  }

  async execute(absolutePath: string, contentsId: string) {
    const trimmedId = this.trim(contentsId);

    const relative = this.filePathFromAbsolutePathCreator.run(absolutePath);

    await this.filePathUpdater.run(trimmedId, relative);
  }
}

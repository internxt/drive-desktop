import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { FilePathUpdater } from '../../modules/files/application/FilePathUpdater';

export class RenameOrMoveController {
  constructor(
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly filePathUpdater: FilePathUpdater
  ) {}

  async execute(absolutePath: string, contentsId: string) {
    const sanitazedContentsId = contentsId.replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1F\x7F-\x9F]/g,
      ''
    );
    const relative = this.filePathFromAbsolutePathCreator.run(absolutePath);

    await this.filePathUpdater.run(sanitazedContentsId, relative);
  }
}

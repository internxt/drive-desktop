import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { WebdavFileRenamer } from '../../modules/files/application/WebdavFileRenamer';

export class RenameOrMoveCallback {
  constructor(
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileRenamer: WebdavFileRenamer
  ) {}

  async execute(absolutePath: string, contentsId: string) {
    const sanitazedContentsId = contentsId.replace(
      // eslint-disable-next-line no-control-regex
      /[\x00-\x1F\x7F-\x9F]/g,
      ''
    );
    const relative = this.filePathFromAbsolutePathCreator.run(absolutePath);

    await this.fileRenamer.run(sanitazedContentsId, relative);
  }
}

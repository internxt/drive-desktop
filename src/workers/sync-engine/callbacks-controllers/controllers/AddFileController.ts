import Logger from 'electron-log';
import { ContentsUploader } from '../../modules/contents/application/ContentsUploader';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { CallbackController } from './CallbackController';

export type DehydrateAndCreatePlaceholder = (
  id: string,
  relativePath: string,
  size: number
) => void;

export class AddFileController extends CallbackController {
  constructor(
    private readonly contentsUploader: ContentsUploader,
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileCreator: FileCreator
  ) {
    super();
  }

  private async runAsync(
    absolutePath: string,
    done: DehydrateAndCreatePlaceholder
  ) {
    const fileContents = await this.contentsUploader.run(absolutePath);

    const path = this.filePathFromAbsolutePathCreator.run(absolutePath);

    const file = await this.fileCreator.run(path, fileContents);

    done(file.contentsId, file.path.value, file.size);
  }

  execute(
    absolutePath: string,
    dehydrateAndCreatePlaceholder: DehydrateAndCreatePlaceholder
  ) {
    this.runAsync(absolutePath, dehydrateAndCreatePlaceholder)
      .then(() => Logger.info('File added successfully'))
      .catch((err) => Logger.error('Error when adding a file: ', err));
  }
}

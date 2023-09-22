import Logger from 'electron-log';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { CallbackController } from './CallbackController';
import { RetryContentsUploader } from 'workers/sync-engine/modules/contents/application/RetryContentsUploader';
import { File } from '../../modules/files/domain/File';

export type DehydrateAndCreatePlaceholder = (
  id: string,
  relativePath: string,
  size: number
) => void;

export class AddFileController extends CallbackController {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileCreator: FileCreator
  ) {
    super();
  }

  private async runAsync(absolutePath: string) {
    const fileContents = await this.contentsUploader.run(absolutePath);

    const path = this.filePathFromAbsolutePathCreator.run(absolutePath);

    return this.fileCreator.run(path, fileContents);
  }

  execute(
    absolutePath: string,
    callback: (acknowledge: boolean, id: string) => void
  ) {
    this.runAsync(absolutePath)
      .then((file: File) => {
        Logger.info('File added successfully');
        callback(true, file.contentsId);
      })
      .catch((err) => {
        callback(false, '');
        Logger.error('Error when adding a file: ', err);
      });
  }
}

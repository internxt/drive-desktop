import Logger from 'electron-log';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { CallbackController } from './CallbackController';
import { RetryContentsUploader } from '../../modules/contents/application/RetryContentsUploader';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { FileByPartialSearcher } from '../../modules/files/application/FileByPartialSearcher';
import { PlatformPathConverter } from '../../modules/shared/test/helpers/PlatformPathConverter';

export type DehydrateAndCreatePlaceholder = (
  id: string,
  relativePath: string,
  size: number
) => void;

export class AddFileController extends CallbackController {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileCreator: FileCreator,
    private readonly fileDeleter: FileDeleter,
    private readonly searchByPartial: FileByPartialSearcher
  ) {
    super();
  }

  async execute(
    absolutePath: string,
    callback: (acknowledge: boolean, id: string) => void
  ): Promise<void> {
    try {
      const path = this.filePathFromAbsolutePathCreator.run(absolutePath);
      const file = this.searchByPartial.run({
        path: PlatformPathConverter.winToPosix(path.value),
      });

      const fileContents = await this.contentsUploader.run(absolutePath);

      if (file) {
        Logger.info('File already exists, deleting previous one');
        await this.fileDeleter.run(file.contentsId);
        Logger.info('Previous file deleted');
      }

      Logger.info('Creating new file');

      const newFile = await this.fileCreator.run(path, fileContents);
      Logger.info('File added successfully');

      return callback(true, newFile.contentsId);
    } catch (error: unknown) {
      Logger.error('Error when adding a file: ', error);
      callback(false, '');
    }
  }
}

import Logger from 'electron-log';
import { FileCreator } from '../../modules/files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../../modules/files/application/FilePathFromAbsolutePathCreator';
import { CallbackController } from './CallbackController';
import { RetryContentsUploader } from 'workers/sync-engine/modules/contents/application/RetryContentsUploader';

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

  private async runAsync(
    absolutePath: string,
    done: DehydrateAndCreatePlaceholder
  ) {
    const fileContents = await this.contentsUploader.run(absolutePath);

    const path = this.filePathFromAbsolutePathCreator.run(absolutePath);

    const file = await this.fileCreator.run(path, fileContents);

    Logger.info('File added successfully');

    done(file.contentsId, file.path.value, file.size);
    Logger.info('File added successfully');
  }

  execute(
    absolutePath: string,
    dehydrateAndCreatePlaceholder: DehydrateAndCreatePlaceholder
  ) {
    this.runAsync(absolutePath, dehydrateAndCreatePlaceholder).catch((err) =>
      Logger.error('Error when adding a file: ', err)
    );
  }
}

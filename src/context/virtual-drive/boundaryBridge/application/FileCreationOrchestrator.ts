import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileCreator } from '../../files/application/FileCreator';
import { SameFileWasMoved } from '../../files/application/SameFileWasMoved';
import { File } from '../../files/domain/File';
import { FilePath } from '../../files/domain/FilePath';
import Logger from 'electron-log';

export class FileCreationOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileCreator: FileCreator,
    private readonly sameFileWasMoved: SameFileWasMoved,
  ) {}

  async run(posixRelativePath: string): Promise<File['contentsId']> {
    const path = new FilePath(posixRelativePath);

    const wasMoved = await this.sameFileWasMoved.run(path);

    if (wasMoved.result) {
      // When a file gets moved, a file creation get triggered.
      // if we find out that its the same file return the contents Id of that file
      Logger.debug('File was moved here' + path.value);

      throw new Error('File was moved here');
    }
    Logger.debug('[DEBUG IN FILECREATIONORCHESTRATOR STEEP 1]' + path.value);

    const fileContents = await this.contentsUploader.run(posixRelativePath);

    Logger.debug('[DEBUG IN FILECREATIONORCHESTRATOR STEEP 2]' + path.value);

    const createdFile = await this.fileCreator.run(path, fileContents);

    return createdFile.contentsId;
  }
}

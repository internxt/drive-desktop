import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileCreator } from '../../files/application/FileCreator';
import { FilePathFromAbsolutePathCreator } from '../../files/application/FilePathFromAbsolutePathCreator';
import { File } from '../../files/domain/File';

export class FileCreationOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly filePathFromAbsolutePathCreator: FilePathFromAbsolutePathCreator,
    private readonly fileCreator: FileCreator
  ) {}

  async run(absolutePath: string): Promise<File['contentsId']> {
    const path = this.filePathFromAbsolutePathCreator.run(absolutePath);

    const fileContents = await this.contentsUploader.run(absolutePath);

    const createdFile = await this.fileCreator.run(path, fileContents);

    return createdFile.contentsId;
  }
}

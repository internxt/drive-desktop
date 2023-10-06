import { RetryContentsUploader } from '../../contents/application/RetryContentsUploader';
import { FileCreator } from '../../files/application/FileCreator';
import { File } from '../../files/domain/File';
import { FilePath } from '../../files/domain/FilePath';

export class FileCreationOrchestrator {
  constructor(
    private readonly contentsUploader: RetryContentsUploader,
    private readonly fileCreator: FileCreator
  ) {}

  async run(posixRelativePath: string): Promise<File['contentsId']> {
    const path = new FilePath(posixRelativePath);

    const fileContents = await this.contentsUploader.run(posixRelativePath);

    const createdFile = await this.fileCreator.run(path, fileContents);

    return createdFile.contentsId;
  }
}

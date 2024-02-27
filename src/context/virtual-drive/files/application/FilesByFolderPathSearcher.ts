import { ParentFolderFinder } from '../../folders/application/ParentFolderFinder';
import { FolderPath } from '../../folders/domain/FolderPath';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';

export class FilesByFolderPathSearcher {
  constructor(
    private readonly repository: FileRepository,
    private readonly parentFolderFinder: ParentFolderFinder
  ) {}

  async run(folderPath: FolderPath): Promise<Array<File['nameWithExtension']>> {
    const folder = await this.parentFolderFinder.run(folderPath);

    const files = this.repository.matchingPartial({
      folderId: folder.id,
      status: FileStatuses.EXISTS,
    });

    return files.map((file) => file.nameWithExtension);
  }
}

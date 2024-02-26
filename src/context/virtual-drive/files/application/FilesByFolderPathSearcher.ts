import { FolderFinder } from '../../folders/application/FolderFinder';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';
import { FileStatuses } from '../domain/FileStatus';

export class FilesByFolderPathSearcher {
  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder
  ) {}

  async run(folderPath: string): Promise<Array<File['nameWithExtension']>> {
    const folder = this.folderFinder.run(folderPath);

    const files = this.repository.matchingPartial({
      folderId: folder.id,
      status: FileStatuses.EXISTS,
    });

    return files.map((file) => file.nameWithExtension);
  }
}

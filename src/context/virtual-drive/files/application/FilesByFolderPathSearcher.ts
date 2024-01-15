import { FolderFinder } from '../../folders/application/FolderFinder';
import { File } from '../domain/File';
import { FileRepository } from '../domain/FileRepository';

export class FilesByFolderPathSearcher {
  constructor(
    private readonly repository: FileRepository,
    private readonly folderFinder: FolderFinder
  ) {}

  async run(folderPath: string): Promise<Array<File['nameWithExtension']>> {
    const folder = this.folderFinder.run(folderPath);

    const files = await this.repository.listByPartial({ folderId: folder.id });

    return files.map((file) => file.nameWithExtension);
  }
}

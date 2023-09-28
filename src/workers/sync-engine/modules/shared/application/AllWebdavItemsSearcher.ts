import { FileRepository } from '../../files/domain/FileRepository';
import { FolderFinder } from '../../folders/application/FolderFinder';
import { FolderRepository } from '../../folders/domain/FolderRepository';

export class AllWebdavItemsNameLister {
  constructor(
    private readonly filesRepository: FileRepository,
    private readonly folderRepository: FolderRepository,
    private readonly folderfinder: FolderFinder
  ) {}

  async run(path: string): Promise<Array<string>> {
    const folder = this.folderfinder.run(path);

    const names: Array<string> = [];

    const files = await this.filesRepository.searchOnFolder(folder.id);

    files.forEach((file) => names.push(file.nameWithExtension));

    const folders = await this.folderRepository.searchOn(folder);

    folders.forEach((folder) => names.push(folder.name));

    return names;
  }
}

import { OldFileRepository } from '../../files/domain/OldFileRepository';
import { FolderFinder } from '../../folders/application/FolderFinder';
import { OldFolderRepository } from '../../folders/domain/OldFolderRepository';

export class AllWebdavItemsNameLister {
  constructor(
    private readonly filesRepository: OldFileRepository,
    private readonly folderRepository: OldFolderRepository,
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

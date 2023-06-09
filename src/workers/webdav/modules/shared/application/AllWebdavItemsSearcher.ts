import { WebdavFileRepository } from '../../files/domain/WebdavFileRepository';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { WebdavFolderRepository } from '../../folders/domain/WebdavFolderRepository';

export class AllWebdavItemsNameLister {
  constructor(
    private readonly filesRepository: WebdavFileRepository,
    private readonly folderRepository: WebdavFolderRepository,
    private readonly folderfinder: WebdavFolderFinder
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

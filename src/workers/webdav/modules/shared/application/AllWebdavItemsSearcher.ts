import { WebdavFileRepository } from '../../files/domain/WebdavFileRepository';
import { WebdavFolderFinder } from '../../folders/application/WebdavFolderFinder';
import { WebdavFolderRepository } from '../../folders/domain/WebdavFolderRepository';

export class AllWebdavItemsNameLister {
  constructor(
    private readonly filesRepository: WebdavFileRepository,
    private readonly folderRepository: WebdavFolderRepository,
    private readonly folderfinder: WebdavFolderFinder
  ) {}

  run(path: string): Array<string> {
    const folder = this.folderfinder.run(path);

    const names: Array<string> = [];

    this.filesRepository
      .searchOnFolder(folder.id)
      .forEach((file) => names.push(file.path.nameWithExtension()));

    this.folderRepository
      .searchOnFolder(folder.id)
      .forEach((folder) => names.push(folder.name));

    return names;
  }
}

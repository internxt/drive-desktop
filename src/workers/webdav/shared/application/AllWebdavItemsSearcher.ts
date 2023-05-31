import { WebdavFileRepository } from 'workers/webdav/files/domain/WebdavFileRepository';
import { WebdavFolderFinder } from 'workers/webdav/folders/application/WebdavFolderFinder';
import { WebdavFolderRepository } from 'workers/webdav/folders/domain/WebdavFolderRepository';
import Logger from 'electron-log';

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

    Logger.debug('LISTED NAMES ', names);

    return names;
  }
}

import { FilePath } from '../../files/domain/FilePath';
import { File } from '../../files/domain/File';
import { FileRepository } from '../../files/domain/FileRepository';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFolderRepository } from '../../folders/domain/WebdavFolderRepository';

export class WebdavUnknownItemTypeSearcher {
  constructor(
    private readonly filesRepository: FileRepository,
    private readonly folderRepository: WebdavFolderRepository
  ) {}

  run(path: string): File | WebdavFolder | undefined {
    const file = this.filesRepository.search(new FilePath(path));

    if (file) return file;

    return this.folderRepository.search(path);
  }
}

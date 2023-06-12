import { FilePath } from '../../files/domain/FilePath';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFileRepository } from '../../files/domain/WebdavFileRepository';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFolderRepository } from '../../folders/domain/WebdavFolderRepository';

export class WebdavUnknownItemTypeSearcher {
  constructor(
    private readonly filesRepository: WebdavFileRepository,
    private readonly folderRepository: WebdavFolderRepository
  ) {}

  run(path: string): WebdavFile | WebdavFolder | undefined {
    const file = this.filesRepository.search(new FilePath(path));

    if (file) return file;

    return this.folderRepository.search(path);
  }
}

import { FilePath } from '../../files/domain/FilePath';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFileRepository } from '../../files/domain/WebdavFileRepository';
import { Folder } from '../../folders/domain/Folder';
import { FolderRepository } from '../../folders/domain/FolderRepository';

export class WebdavUnknownItemTypeSearcher {
  constructor(
    private readonly filesRepository: WebdavFileRepository,
    private readonly folderRepository: FolderRepository
  ) {}

  run(path: string): WebdavFile | Folder | undefined {
    const file = this.filesRepository.search(new FilePath(path));

    if (file) return file;

    return this.folderRepository.search(path);
  }
}

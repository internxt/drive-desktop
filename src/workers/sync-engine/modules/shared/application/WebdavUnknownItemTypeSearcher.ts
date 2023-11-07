import { FilePath } from '../../files/domain/FilePath';
import { File } from '../../files/domain/File';
import { OldFileRepository } from '../../files/domain/OldFileRepository';
import { Folder } from '../../folders/domain/Folder';
import { FolderRepository } from '../../folders/domain/FolderRepository';

export class WebdavUnknownItemTypeSearcher {
  constructor(
    private readonly filesRepository: OldFileRepository,
    private readonly folderRepository: FolderRepository
  ) {}

  run(path: string): File | Folder | undefined {
    const file = this.filesRepository.search(new FilePath(path));

    if (file) return file;

    return this.folderRepository.search(path);
  }
}

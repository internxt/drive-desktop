import { FilePath } from '../../files/domain/FilePath';
import { File } from '../../files/domain/File';
import { FileRepository } from '../../files/domain/FileRepository';
import { Folder } from '../../folders/domain/Folder';
import { FolderRepository } from '../../folders/domain/FolderRepository';

export class WebdavUnknownItemTypeSearcher {
  constructor(
    private readonly filesRepository: FileRepository,
    private readonly folderRepository: FolderRepository
  ) {}

  run(path: string): File | Folder | undefined {
    const file = this.filesRepository.search(new FilePath(path));

    if (file) return file;

    return this.folderRepository.search(path);
  }
}

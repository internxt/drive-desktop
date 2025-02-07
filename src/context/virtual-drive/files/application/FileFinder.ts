import { FilePath } from '../../files/domain/FilePath';
import { FileNotFoundError } from '../domain/errors/FileNotFoundError';
import { File } from '../domain/File';
import { InMemoryFileRepository } from '../infrastructure/InMemoryFileRepository';

export class FileFinder {
  constructor(private readonly repository: InMemoryFileRepository) {}

  run(path: string): File {
    const file = this.repository.searchByPartial({ path });

    if (!file) {
      throw new FileNotFoundError(path);
    }

    return file;
  }

  findFromFilePath(path: FilePath): File {
    const file = this.repository.searchByPartial({ path: path.dirname() });

    if (!file) {
      throw new FileNotFoundError(path.dirname());
    }

    return file;
  }
  findFromUuid(uuid: File['uuid']): File {
    const folder = this.repository.searchByPartial({ uuid });
    if (!folder) {
      throw new Error('Folder not found');
    }
    return folder;
  }
}

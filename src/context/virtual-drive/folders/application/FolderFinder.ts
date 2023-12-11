import { FilePath } from '../../files/domain/FilePath';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import logger from 'electron-log';

export class FolderFinder {
  constructor(private readonly repository: FolderRepository) {}

  run(path: string): Folder {
    const folder = this.repository.searchByPartial({ path });

    if (!folder) {
      throw new FolderNotFoundError(path);
    }

    return folder;
  }

  async findFromFilePath(path: FilePath): Promise<Folder> {
    let folder = this.repository.searchByPartial({ path: path.dirname() });
    let times = 5;
    // repetir intentos 5 veces
    while (!folder && times > 0) {
      logger.info('Folder not found, retrying in 1 second...');
      folder = this.repository.searchByPartial({ path: path.dirname() });
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
      times--;
    }

    if (!folder) {
      throw new FolderNotFoundError(path.dirname());
    }

    return folder;
  }
}

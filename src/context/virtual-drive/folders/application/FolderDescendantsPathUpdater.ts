import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FileRepository } from '../../files/domain/FileRepository';
import { FolderStatuses } from '../domain/FolderStatus';
import { FileStatuses } from '../../files/domain/FileStatus';

@Service()
export class FolderDescendantsPathUpdater {
  private static readonly BATCH_SIZE = 1000;

  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly fileRepository: FileRepository,
  ) {}

  async syncDescendants(folder: Folder, oldPath: string) {
    const startTime = Date.now();

    const [foldersUpdated, filesUpdated] = await Promise.all([
      this.updateDescendantFolders(oldPath, folder.path),
      this.updateDescendantFiles(oldPath, folder.path),
    ]);

    if (foldersUpdated === 0 || filesUpdated === 0) return;

    const totalTime = Date.now() - startTime;
    logger.debug({
      msg: '[FolderDescendantsPathUpdater] Descendants updated',
      foldersUpdated,
      filesUpdated,
      folderName: folder.name,
      totalTime: `${totalTime}ms`,
    });
  }

  private async updateDescendantFolders(oldPath: string, newPath: string) {
    const pathPrefix = oldPath + '/';

    const descendants = this.folderRepository.searchByPathPrefix(pathPrefix, FolderStatuses.EXISTS);

    if (descendants.length === 0) return 0;

    descendants.forEach((folder) => {
      const updatedPath = folder.path.replace(oldPath, newPath);
      folder.update({ path: updatedPath });
    });

    for (let i = 0; i < descendants.length; i += FolderDescendantsPathUpdater.BATCH_SIZE) {
      const batch = descendants.slice(i, i + FolderDescendantsPathUpdater.BATCH_SIZE);
      Promise.all(batch.map((folder) => this.folderRepository.update(folder)));
    }

    return descendants.length;
  }

  private async updateDescendantFiles(oldPath: string, newPath: string) {
    const pathPrefix = oldPath + '/';

    const descendants = this.fileRepository.searchByPathPrefix(pathPrefix, FileStatuses.EXISTS);

    if (descendants.length === 0) return 0;

    descendants.forEach((file) => {
      const updatedPath = file.path.replace(oldPath, newPath);
      file.update({ path: updatedPath });
    });

    for (let i = 0; i < descendants.length; i += FolderDescendantsPathUpdater.BATCH_SIZE) {
      const batch = descendants.slice(i, i + FolderDescendantsPathUpdater.BATCH_SIZE);
      Promise.all(batch.map((file) => this.fileRepository.update(file)));
    }

    return descendants.length;
  }
}

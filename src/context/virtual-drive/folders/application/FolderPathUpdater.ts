import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { FolderMover } from './FolderMover';
import { FolderRenamer } from './FolderRenamer';
import { logger } from '@/apps/shared/logger/logger';

export class FolderPathUpdater {
  constructor(
    private readonly repository: FolderRepository,
    private readonly folderMover: FolderMover,
    private readonly folderRenamer: FolderRenamer,
  ) {}

  async run(uuid: Folder['uuid'], posixRelativePath: string) {
    const folder = this.repository.searchByPartial({ uuid });

    logger.debug({
      msg: 'FolderPathUpdater.run',
    });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    const desiredPath = new FolderPath(posixRelativePath);

    const dirnameChanged = folder.dirname.value !== desiredPath.dirname();
    const nameChanged = folder.name !== desiredPath.name();

    if (dirnameChanged && nameChanged) {
      throw new ActionNotPermittedError('Move and rename (at the same time)');
    }

    if (dirnameChanged) {
      return await this.folderMover.run(folder, desiredPath);
    }

    if (nameChanged) {
      return await this.folderRenamer.run(folder, desiredPath);
    }

    return;
  }
}

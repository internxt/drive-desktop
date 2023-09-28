import path from 'path';
import { Folder } from '../domain/Folder';
import { FolderPathCreator } from './FolderPathCreator';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderMover } from './FolderMover';
import { FolderRenamer } from './FolderRenamer';

export class FolderPathUpdater {
  constructor(
    private readonly repository: FolderRepository,
    private readonly pathCreator: FolderPathCreator,
    private readonly folderMover: FolderMover,
    private readonly folderRenamer: FolderRenamer
  ) {}

  async run(uuid: Folder['uuid'], absolutePath: string) {
    const normalized = path.normalize(absolutePath);

    const folder = this.repository.searchByPartial({ uuid });

    if (!folder) {
      throw new FolderNotFoundError(uuid);
    }

    const desiredPath = this.pathCreator.fromAbsolute(normalized);

    const dirnameChanged = folder.dirname !== desiredPath.dirname();
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

    throw new Error('No path change detected for folder path update');
  }
}

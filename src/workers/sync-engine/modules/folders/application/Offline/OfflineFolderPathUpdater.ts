import { OfflineFolder } from '../../domain/OfflineFolder';
import { ActionNotPermittedError } from '../../domain/errors/ActionNotPermittedError';
import { OfflineFolderMover } from './OfflineFolderMover';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { OfflineFolderRenamer } from './OfflineFolderRenamer';
import { FolderPath } from '../../domain/FolderPath';

// TODO: Can be unified with FolderPathUpdater
export class OfflineFolderPathUpdater {
  constructor(
    private readonly offlineFoldersRepository: OfflineFolderRepository,
    private readonly offlineFolderMover: OfflineFolderMover,
    private readonly offlineFolderRenamer: OfflineFolderRenamer
  ) {}

  async run(uuid: OfflineFolder['uuid'], posixRelativePath: string) {
    const folder = this.offlineFoldersRepository.searchByPartial({ uuid });

    if (!folder) {
      throw new Error(`Folder ${uuid} not found in offline folders`);
    }

    const desiredPath = new FolderPath(posixRelativePath);

    const dirnameChanged = folder.dirname !== desiredPath.dirname();
    const nameChanged = folder.name !== desiredPath.name();

    if (dirnameChanged && nameChanged) {
      throw new ActionNotPermittedError('Move and rename (at the same time)');
    }

    if (dirnameChanged) {
      return await this.offlineFolderMover.run(folder, desiredPath);
    }

    if (nameChanged) {
      return this.offlineFolderRenamer.run(folder, desiredPath);
    }

    throw new Error('No path change detected for folder path update');
  }
}

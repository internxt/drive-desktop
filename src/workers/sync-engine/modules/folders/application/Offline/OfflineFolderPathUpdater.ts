import path from 'path';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { FolderPathCreator } from '../FolderPathCreator';
import { ActionNotPermittedError } from '../../domain/errors/ActionNotPermittedError';
import { OfflineFolderMover } from './OfflineFolderMover';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { OfflineFolderRenamer } from './OfflineFolderRenamer';

export class OfflineFolderPathUpdater {
  constructor(
    private readonly offlineFoldersRepository: OfflineFolderRepository,
    private readonly pathCreator: FolderPathCreator,
    private readonly offlineFolderMover: OfflineFolderMover,
    private readonly offlineFolderRenamer: OfflineFolderRenamer
  ) {}

  async run(uuid: OfflineFolder['uuid'], absolutePath: string) {
    const normalized = path.normalize(absolutePath);

    const folder = this.offlineFoldersRepository.getByUuid(uuid);

    if (!folder) {
      throw new Error(`Folder ${uuid} not found in offline folders`);
    }

    const desiredPath = this.pathCreator.fromAbsolute(normalized);

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

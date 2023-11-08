import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { ActionNotPermittedError } from '../../domain/errors/ActionNotPermittedError';
import { FolderFinder } from '../FolderFinder';

export class OfflineFolderMover {
  constructor(
    private readonly offlineFolderRepository: OfflineFolderRepository,
    private readonly folderFinder: FolderFinder
  ) {}

  async run(folder: OfflineFolder, destination: FolderPath) {
    const resultFolder = this.offlineFolderRepository.searchByPartial({
      path: destination.value,
    });

    const shouldBeMerge = resultFolder !== undefined;

    if (shouldBeMerge) {
      throw new ActionNotPermittedError('overwrite');
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    folder.moveTo(destinationFolder);
    this.offlineFolderRepository.update(folder);
  }
}

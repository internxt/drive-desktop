import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { ActionNotPermittedError } from '../../domain/errors/ActionNotPermittedError';
import { InMemoryOfflineFolderRepository } from '../../infrastructure/InMemoryOfflineFolderRepository';
import { FolderFinder } from '../FolderFinder';

export class OfflineFolderMover {
  constructor(
    private readonly offlineFolderRepository: InMemoryOfflineFolderRepository,
    private readonly folderFinder: FolderFinder,
  ) {}

  run(folder: OfflineFolder, destination: FolderPath) {
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

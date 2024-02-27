import { FolderPath } from '../../domain/FolderPath';
import { OfflineFolder } from '../../domain/OfflineFolder';
import { OfflineFolderRepository } from '../../domain/OfflineFolderRepository';
import { ActionNotPermittedError } from '../../domain/errors/ActionNotPermittedError';
import { ParentFolderFinder } from '../ParentFolderFinder';

export class OfflineFolderMover {
  constructor(
    private readonly offlineFolderRepository: OfflineFolderRepository,
    private readonly parentFolderFinder: ParentFolderFinder
  ) {}

  async run(folder: OfflineFolder, destination: FolderPath) {
    const resultFolder = this.offlineFolderRepository.searchByPartial({
      path: destination.value,
    });

    const shouldBeMerge = resultFolder !== undefined;

    if (shouldBeMerge) {
      throw new ActionNotPermittedError('overwrite');
    }

    const destinationFolder = await this.parentFolderFinder.run(destination);

    folder.moveTo(destinationFolder);
    this.offlineFolderRepository.update(folder);
  }
}

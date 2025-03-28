import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderFinder } from './FolderFinder';
import { FolderRepository } from '../domain/FolderRepository';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';

export class FolderMover {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
    private readonly folderFinder: FolderFinder,
  ) {}

  private async move(folder: Folder, parentFolder: Folder) {
    folder.moveTo(parentFolder);

    await this.remote.move(folder);
    await this.repository.update(folder);
  }

  async run(folder: Folder, destination: FolderPath): Promise<void> {
    const resultFolder = this.repository.searchByPartial({
      path: destination.value,
    });

    const shouldBeMerge = resultFolder !== undefined;

    if (shouldBeMerge) {
      throw new ActionNotPermittedError('overwrite');
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    await this.move(folder, destinationFolder);
  }
}

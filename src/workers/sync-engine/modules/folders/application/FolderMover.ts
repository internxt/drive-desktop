import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderFinder } from './FolderFinder';
import { FolderInternxtFileSystem } from '../domain/FolderInternxtFileSystem';

export class FolderMover {
  constructor(
    private readonly fileSystem: FolderInternxtFileSystem,
    private readonly repository: FolderRepository,
    private readonly folderFinder: FolderFinder
  ) {}

  private async move(folder: Folder, parentFolder: Folder) {
    folder.moveTo(parentFolder);

    await this.fileSystem.move(folder);
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

    const destinationFolder = await this.folderFinder.run(
      destination.dirname()
    );

    await this.move(folder, destinationFolder);
  }
}

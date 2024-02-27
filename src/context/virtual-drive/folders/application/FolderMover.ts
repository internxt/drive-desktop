import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { ParentFolderFinder } from './ParentFolderFinder';
import { FolderRepository } from '../domain/FolderRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { FolderStatuses } from '../domain/FolderStatus';

export class FolderMover {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly fileParentFolderFinder: ParentFolderFinder
  ) {}

  private async move(folder: Folder, parentFolder: Folder) {
    folder.moveTo(parentFolder);

    await this.remote.move(folder);
    await this.repository.update(folder);
  }

  async run(folder: Folder, destination: FolderPath): Promise<void> {
    const resultFolder = this.repository.matchingPartial({
      path: destination.value,
      status: FolderStatuses.EXISTS,
    });

    const shouldBeMerge = resultFolder.length > 0;

    if (shouldBeMerge) {
      throw new ActionNotPermittedError('overwrite');
    }

    const destinationFolder = await this.fileParentFolderFinder.run(
      destination
    );

    await this.move(folder, destinationFolder);
  }
}

import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatuses } from '../domain/FolderStatus';
import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { ParentFolderFinder } from './ParentFolderFinder';
import { FolderDescendantsPathUpdater } from './FolderDescendantsPathUpdater';

@Service()
export class FolderMover {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly fileParentFolderFinder: ParentFolderFinder,
    private readonly descendantsPathUpdater: FolderDescendantsPathUpdater,
  ) {}

  private async move(folder: Folder, parentFolder: Folder) {
    const oldPath = folder.path;
    folder.moveTo(parentFolder);

    await this.remote.move(folder.uuid, parentFolder.uuid);
    await this.repository.update(folder);

    void this.descendantsPathUpdater.syncDescendants(folder, oldPath);
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

    const destinationFolder = await this.fileParentFolderFinder.run(destination);

    await this.move(folder, destinationFolder);
  }
}

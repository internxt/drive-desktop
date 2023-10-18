import { ActionNotPermittedError } from '../domain/errors/ActionNotPermittedError';
import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderFinder } from './FolderFinder';
import { EventBus } from '../../shared/domain/EventBus';

export class FolderMover {
  constructor(
    private readonly repository: FolderRepository,
    private readonly folderFinder: FolderFinder,
    private readonly eventBus: EventBus
  ) {}

  private async move(folder: Folder, parentFolder: Folder) {
    folder.moveTo(parentFolder);

    await this.repository.updateParentDir(folder);

    this.eventBus.publish(folder.pullDomainEvents());
  }

  async run(folder: Folder, destination: FolderPath): Promise<void> {
    const resultFolder = this.repository.search(destination.value);

    const shouldBeMerge = resultFolder !== undefined;

    if (shouldBeMerge) {
      throw new ActionNotPermittedError('overwrite');
    }

    const destinationFolder = this.folderFinder.run(destination.dirname());

    await this.move(folder, destinationFolder);
  }
}

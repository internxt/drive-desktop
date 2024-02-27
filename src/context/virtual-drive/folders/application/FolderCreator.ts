import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderCreatedAt } from '../domain/FolderCreatedAt';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatuses } from '../domain/FolderStatus';
import { FolderUpdatedAt } from '../domain/FolderUpdatedAt';
import { FolderUuid } from '../domain/FolderUuid';
import { FolderAlreadyExists } from '../domain/errors/FolderAlreadyExists';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { SingleFolderMatchingFinder } from './SingleFolderMatchingFinder';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly singleFolderFinder: SingleFolderMatchingFinder,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus
  ) {}

  private ensureItDoesNotExists(path: FolderPath): void {
    const folder = this.repository.matchingPartial({
      path: path.value,
      status: FolderStatuses.EXISTS,
    });

    if (folder.length > 0) {
      throw new FolderAlreadyExists(folder[0]);
    }
  }

  private async findParentId(path: FolderPath): Promise<FolderId> {
    const parent = await this.singleFolderFinder.run({ path: path.value });
    return new FolderId(parent.id);
  }

  async run(path: string): Promise<void> {
    const folderPath = new FolderPath(path);

    this.ensureItDoesNotExists(folderPath);

    const parentId = await this.findParentId(folderPath);

    const response = await this.remote.persist(folderPath, parentId);

    const folder = Folder.create(
      new FolderId(response.id),
      new FolderUuid(response.uuid),
      folderPath,
      parentId,
      FolderCreatedAt.fromString(response.createdAt),
      FolderUpdatedAt.fromString(response.updatedAt)
    );

    await this.repository.add(folder);

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);
  }
}

import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderCreatedAt } from '../domain/FolderCreatedAt';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderStatuses } from '../domain/FolderStatus';
import { FolderUpdatedAt } from '../domain/FolderUpdatedAt';
import { FolderUuid } from '../domain/FolderUuid';
import { FolderInPathAlreadyExistsError } from '../domain/errors/FolderInPathAlreadyExistsError';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { ParentFolderFinder } from './ParentFolderFinder';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly parentFolderFinder: ParentFolderFinder,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus
  ) {}

  private async ensureItDoesNotExists(path: FolderPath): Promise<void> {
    const result = this.repository.matchingPartial({
      path: path.value,
      status: FolderStatuses.EXISTS,
    });

    if (result.length > 0) {
      throw new FolderInPathAlreadyExistsError(path);
    }
  }

  private async findParentId(path: FolderPath): Promise<FolderId> {
    const parent = await this.parentFolderFinder.run(path);
    return new FolderId(parent.id);
  }

  async run(path: string): Promise<void> {
    const folderPath = new FolderPath(path);

    await this.ensureItDoesNotExists(folderPath);

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

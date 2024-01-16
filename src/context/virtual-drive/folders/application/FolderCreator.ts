import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderCreatedAt } from '../domain/FolderCreatedAt';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderUpdatedAt } from '../domain/FolderUpdatedAt';
import { FolderUuid } from '../domain/FolderUuid';
import { FolderAlreadyExists } from '../domain/errors/FolderAlreadyExists';
import { FolderNotFoundError } from '../domain/errors/FolderNotFoundError';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus
  ) {}

  private ensureItDoesNotExists(path: FolderPath): void {
    const folder = this.repository.searchByPartial({ path: path.value });

    if (!folder) {
      return;
    }

    throw new FolderAlreadyExists(folder);
  }

  private findParentId(path: FolderPath): FolderId {
    const parent = this.repository.searchByPartial({
      path: path.dirname(),
    });

    if (!parent) {
      throw new FolderNotFoundError(path.dirname());
    }

    return new FolderId(parent.id);
  }

  async run(path: string): Promise<void> {
    const folderPath = new FolderPath(path);

    this.ensureItDoesNotExists(folderPath);

    const parentId = this.findParentId(folderPath);

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

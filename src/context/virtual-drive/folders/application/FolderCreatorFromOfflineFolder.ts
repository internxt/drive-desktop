import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderCreatedAt } from '../domain/FolderCreatedAt';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderSyncNotifier } from '../domain/FolderSyncNotifier';
import { FolderUpdatedAt } from '../domain/FolderUpdatedAt';
import { FolderUuid } from '../domain/FolderUuid';
import { OfflineFolder } from '../domain/OfflineFolder';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FolderCreatorFromOfflineFolder {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus,
    private readonly notifier: FolderSyncNotifier
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.notifier.creating(offlineFolder.name);

    const attributes = await this.remote.persist(
      new FolderPath(offlineFolder.path),
      new FolderId(offlineFolder.parentId),
      new FolderUuid(offlineFolder.uuid)
    );

    const folder = Folder.create(
      new FolderId(attributes.id),
      new FolderUuid(attributes.uuid),
      new FolderPath(offlineFolder.path),
      new FolderId(attributes.parentId),
      FolderCreatedAt.fromString(attributes.createdAt),
      FolderUpdatedAt.fromString(attributes.updatedAt)
    );

    await this.repository.add(folder);

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);

    this.notifier.created(offlineFolder.name);

    return folder;
  }
}

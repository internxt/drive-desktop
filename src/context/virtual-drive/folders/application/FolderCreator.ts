import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderSyncNotifier } from '../domain/FolderSyncNotifier';
import { OfflineFolder } from '../domain/OfflineFolder';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus,
    private readonly notifier: FolderSyncNotifier
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.notifier.creating(offlineFolder.name);

    const attributes = await this.remote.persist(offlineFolder);

    const folder = Folder.create(attributes);

    await this.repository.add(folder);

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);

    this.notifier.created(offlineFolder.name);

    return folder;
  }
}

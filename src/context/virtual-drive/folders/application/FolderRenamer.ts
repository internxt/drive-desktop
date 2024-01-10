import { FolderPath } from '../domain/FolderPath';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { EventBus } from '../../shared/domain/EventBus';
import { FolderRenameStartedDomainEvent } from '../domain/events/FolderRenameStartedDomainEvent';
import { FolderSyncNotifier } from '../domain/FolderSyncNotifier';

export class FolderRenamer {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus,
    private readonly notifier: FolderSyncNotifier
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    this.notifier.rename(folder.name, destination.name());
    this.eventBus.publish([
      new FolderRenameStartedDomainEvent({
        aggregateId: folder.uuid,
        oldName: folder.name,
        newName: destination.name(),
      }),
    ]);

    folder.rename(destination);

    await this.remote.rename(folder);
    await this.repository.update(folder);

    this.eventBus.publish(folder.pullDomainEvents());
    this.notifier.renamed(folder.name, destination.name());
  }
}

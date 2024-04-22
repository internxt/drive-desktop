import { Service } from 'diod';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { SyncFolderMessenger } from '../domain/SyncFolderMessenger';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

@Service()
export class FolderRenamer {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly eventBus: EventBus,
    private readonly syncFolderMessenger: SyncFolderMessenger
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    this.syncFolderMessenger.rename(folder.name, destination.name());

    const nameBeforeRename = folder.name;

    folder.rename(destination);

    await this.remote.rename(folder);
    await this.repository.update(folder);

    this.eventBus.publish(folder.pullDomainEvents());
    this.syncFolderMessenger.renamed(nameBeforeRename, folder.name);
  }
}

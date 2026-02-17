import { Service } from 'diod';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { SyncFolderMessenger } from '../domain/SyncFolderMessenger';
import { FolderDescendantsPathUpdater } from './FolderDescendantsPathUpdater';
import { renameFolder } from '../../../../infra/drive-server/services/folder/services/rename-folder';

@Service()
export class FolderRenamer {
  constructor(
    private readonly repository: FolderRepository,
    private readonly eventBus: EventBus,
    private readonly syncFolderMessenger: SyncFolderMessenger,
    private readonly descendantsPathUpdater: FolderDescendantsPathUpdater,
  ) {}

  async run(folder: Folder, destination: FolderPath) {
    this.syncFolderMessenger.rename(folder.name, destination.name());
    const oldPath = folder.path;
    const nameBeforeRename = folder.name;

    folder.rename(destination);

    const { error } = await renameFolder({ uuid: folder.uuid, plainName: folder.name });
    if (error) {
      throw error;
    }
    await this.repository.update(folder);

    this.eventBus.publish(folder.pullDomainEvents());
    this.syncFolderMessenger.renamed(nameBeforeRename, folder.name);

    void this.descendantsPathUpdater.syncDescendants(folder, oldPath);
  }
}

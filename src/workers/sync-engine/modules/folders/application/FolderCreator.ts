import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { OfflineFolder } from '../domain/OfflineFolder';
import { FolderFinder } from './FolderFinder';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly folderFinder: FolderFinder,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.ipc.send('FOLDER_CREATING', {
      name: offlineFolder.name,
    });

    const parent = this.folderFinder.run(offlineFolder.dirname);

    const folder = await this.repository.create(
      offlineFolder.path,
      parent.id,
      offlineFolder.uuid
    );

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);

    this.ipc.send('FOLDER_CREATED', {
      name: offlineFolder.name,
    });

    return folder;
  }
}

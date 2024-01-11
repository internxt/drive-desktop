import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderRepository } from '../domain/FolderRepository';
import { OfflineFolder } from '../domain/OfflineFolder';
import { RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFileSystem,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.ipc.send('FOLDER_CREATING', {
      name: offlineFolder.basename,
    });

    const attributes = await this.remote.persist(offlineFolder);

    const folder = Folder.create(attributes);

    await this.repository.add(folder);

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);

    this.ipc.send('FOLDER_CREATED', {
      name: offlineFolder.name,
    });

    return folder;
  }
}

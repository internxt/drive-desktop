import { SyncEngineIpc } from '../../../ipcRendererSyncEngine';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderInternxtFileSystem } from '../domain/FolderInternxtFileSystem';
import { FolderRepository } from '../domain/FolderRepository';
import { OfflineFolder } from '../domain/OfflineFolder';

export class FolderCreator {
  constructor(
    private readonly fileSystem: FolderInternxtFileSystem,
    private readonly repository: FolderRepository,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.ipc.send('FOLDER_CREATING', {
      name: offlineFolder.name,
    });

    const folder = await this.fileSystem.create(offlineFolder);
    await this.repository.add(folder);

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);

    this.ipc.send('FOLDER_CREATED', {
      name: offlineFolder.name,
    });

    return folder;
  }
}

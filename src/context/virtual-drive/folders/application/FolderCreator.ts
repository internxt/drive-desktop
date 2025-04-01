import { Service } from 'diod';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { OfflineFolder } from '../domain/OfflineFolder';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';
import { FolderPlaceholderConverter } from './FolderPlaceholderConverter';

@Service()
export class FolderCreator {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus,
    private readonly folderPlaceholderConverter: FolderPlaceholderConverter,
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.ipc.send('FOLDER_CREATING', {
      name: offlineFolder.basename,
    });

    const attributes = await this.remote.persist({
      parentUuid: offlineFolder.parentUuid,
      basename: offlineFolder.basename,
      path: offlineFolder.path.value,
    });

    const folder = Folder.from(attributes);

    await this.repository.add(folder);

    const events = folder.pullDomainEvents();
    this.eventBus.publish(events);

    await this.folderPlaceholderConverter.run(folder);

    this.ipc.send('FOLDER_CREATED', {
      name: offlineFolder.name,
    });

    return folder;
  }
}

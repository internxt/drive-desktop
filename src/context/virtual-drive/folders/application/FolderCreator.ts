import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { EventBus } from '../../shared/domain/EventBus';
import { Folder } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderRepository } from '../domain/FolderRepository';
import { FolderUuid } from '../domain/FolderUuid';
import { OfflineFolder } from '../domain/OfflineFolder';
import { RemoteFolderSystem } from '../domain/file-systems/RemoteFolderSystem';
import { FolderPlaceholderConverter } from './FolderPlaceholderConverter';

export class FolderCreator {
  constructor(
    private readonly repository: FolderRepository,
    private readonly remote: RemoteFolderSystem,
    private readonly ipc: SyncEngineIpc,
    private readonly eventBus: EventBus,
    private readonly folderPlaceholderConverter: FolderPlaceholderConverter
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    this.ipc.send('FOLDER_CREATING', {
      name: offlineFolder.basename,
    });

    const attributes = await this.remote.persist(offlineFolder);

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

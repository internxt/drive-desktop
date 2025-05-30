import { Service } from 'diod';
import { Folder } from '../domain/Folder';
import { OfflineFolder } from '../domain/OfflineFolder';
import { HttpRemoteFolderSystem } from '../infrastructure/HttpRemoteFolderSystem';
import { InMemoryFolderRepository } from '../infrastructure/InMemoryFolderRepository';
import VirtualDrive from '@/node-win/virtual-drive';

@Service()
export class FolderCreator {
  constructor(
    private readonly repository: InMemoryFolderRepository,
    private readonly remote: HttpRemoteFolderSystem,
    private readonly virtualDrive: VirtualDrive,
  ) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    const attributes = await this.remote.persist({
      parentUuid: offlineFolder.parentUuid,
      basename: offlineFolder.basename,
      path: offlineFolder.path.value,
    });

    const folder = Folder.from(attributes);

    this.repository.add(folder);

    this.virtualDrive.convertToPlaceholder({
      itemPath: folder.path,
      id: folder.placeholderId,
    });

    return folder;
  }
}

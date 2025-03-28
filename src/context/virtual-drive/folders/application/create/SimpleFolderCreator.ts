import { Service } from 'diod';
import { FolderPath } from '../../domain/FolderPath';
import { FolderId } from '../../domain/FolderId';
import { Folder } from '../../domain/Folder';
import { FolderUuid } from '../../domain/FolderUuid';
import { FolderCreatedAt } from '../../domain/FolderCreatedAt';
import { FolderUpdatedAt } from '../../domain/FolderUpdatedAt';
import Logger from 'electron-log';
import { HttpRemoteFolderSystem } from '../../infrastructure/HttpRemoteFolderSystem';
import { OfflineFolder } from '../../domain/OfflineFolder';

@Service()
export class SimpleFolderCreator {
  constructor(private readonly rfs: HttpRemoteFolderSystem) {}

  async run(offlineFolder: OfflineFolder): Promise<Folder> {
    Logger.debug('Creating folder', offlineFolder.path.value, 'with parent', offlineFolder.parentId);
    const folderPath = new FolderPath(offlineFolder.path.value);
    Logger.debug('Creating folder', folderPath);

    // const offlineFolder = OfflineFolder

    const response = await this.rfs.persist(offlineFolder);

    const folder = Folder.create({
      id: new FolderId(response.id),
      uuid: new FolderUuid(response.uuid),
      path: folderPath,
      parentId: new FolderId(offlineFolder.parentId),
      parentUuid: new FolderUuid(offlineFolder.parentUuid),
      createdAt: FolderCreatedAt.fromString(response.createdAt),
      updatedAt: FolderUpdatedAt.fromString(response.updatedAt),
    });

    if (!folder) {
      throw new Error('Could not create folder and was not found either');
    }

    return folder;
  }
}

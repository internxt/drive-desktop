import { Service } from 'diod';
import { FolderPath } from '../../domain/FolderPath';
import { FolderId } from '../../domain/FolderId';
import { Folder } from '../../domain/Folder';
import { FolderUuid } from '../../domain/FolderUuid';
import { FolderCreatedAt } from '../../domain/FolderCreatedAt';
import { FolderUpdatedAt } from '../../domain/FolderUpdatedAt';
import Logger from 'electron-log';
import { HttpRemoteFolderSystem } from '../../infrastructure/HttpRemoteFolderSystem';

@Service()
export class SimpleFolderCreator {
  constructor(private readonly rfs: HttpRemoteFolderSystem) {}

  async run(offline: { basename: string; parentUuid: string; path: string; parentId: number }): Promise<Folder> {
    Logger.debug('Creating folder', offline.path, 'with parent', offline.parentId);
    const folderPath = new FolderPath(offline.path);
    Logger.debug('Creating folder', folderPath);

    const response = await this.rfs.persist(offline);

    const folder = Folder.create({
      id: new FolderId(response.id),
      uuid: new FolderUuid(response.uuid),
      path: folderPath,
      parentId: new FolderId(offline.parentId),
      parentUuid: new FolderUuid(offline.parentUuid),
      createdAt: FolderCreatedAt.fromString(response.createdAt),
      updatedAt: FolderUpdatedAt.fromString(response.updatedAt),
    });

    if (!folder) {
      throw new Error('Could not create folder and was not found either');
    }

    return folder;
  }
}

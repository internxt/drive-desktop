import { Service } from 'diod';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';
import { FolderPath } from '../../domain/FolderPath';
import { FolderId } from '../../domain/FolderId';
import { Folder } from '../../domain/Folder';
import { FolderUuid } from '../../domain/FolderUuid';
import { FolderCreatedAt } from '../../domain/FolderCreatedAt';
import { FolderUpdatedAt } from '../../domain/FolderUpdatedAt';
import Logger from 'electron-log';

@Service()
export class SimpleFolderCreator {
  constructor(private readonly rfs: RemoteFileSystem) {}

  async run(path: string, parentId: number, parentUuid: string): Promise<Folder> {
    const folderPath = new FolderPath(path);
    const folderParentId = new FolderId(parentId);

    const response = await this.rfs.persist(folderPath.name(), parentUuid);

    const folder = await response.fold<Promise<Folder | undefined>>(
      async (error): Promise<Folder | undefined> => {
        Logger.warn('The folder was not been able to create', error);
        if (error !== 'ALREADY_EXISTS') {
          return;
        }
        return this.rfs.searchWith(folderParentId, folderPath);
      },
      (dto): Promise<Folder | undefined> => {
        return Promise.resolve(
          Folder.create(
            new FolderId(dto.id),
            new FolderUuid(dto.uuid),
            folderPath,
            folderParentId,
            FolderCreatedAt.fromString(dto.createdAt),
            FolderUpdatedAt.fromString(dto.updatedAt)
          )
        );
      }
    );

    if (!folder) {
      throw new Error('Could not create folder and was not found either');
    }

    return folder;
  }
}

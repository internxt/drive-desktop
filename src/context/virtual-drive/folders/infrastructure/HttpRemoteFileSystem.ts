import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Either, left, right } from '../../../shared/domain/Either';
import { Folder } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderPersistedDto, RemoteFileSystem, RemoteFileSystemErrors } from '../domain/file-systems/RemoteFileSystem';
import { mapToFolderPersistedDto } from '../../utils/map-to-folder-persisted-dto';
import { createFolder } from '../../../../infra/drive-server/services/folder/services/create-folder';
import { searchFolder } from '../../../../infra/drive-server/services/folder/services/search-folder';
import { FolderDto } from '../../../../infra/drive-server/out/dto';

@Service()
export class HttpRemoteFileSystem implements RemoteFileSystem {
  private static PAGE_SIZE = 50;
  private static readonly MAX_RETRIES = 3;

  async searchWith(parentId: FolderId, folderPath: FolderPath): Promise<Folder | undefined> {
    let page = 0;
    const folders: Array<FolderDto> = [];
    let lastNumberOfFolders = 0;

    do {
      const offset = page * HttpRemoteFileSystem.PAGE_SIZE;

      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await searchFolder({
        parentId: parentId.value,
        offset,
        limit: HttpRemoteFileSystem.PAGE_SIZE,
      });

      if (error) {
        logger.error({ msg: 'Error searching subfolders', error });
        return;
      }

      folders.push(...data);
      lastNumberOfFolders = data.length;

      page++;
    } while (folders.length % HttpRemoteFileSystem.PAGE_SIZE === 0 && lastNumberOfFolders > 0);

    const name = folderPath.name();

    const folder = folders.find((folder) => folder.plainName === name);

    if (!folder) return;

    return Folder.from({
      ...folder,
      path: folderPath.value,
    });
  }

  async persist(
    plainName: string,
    parentFolderUuid: string,
    attempt = 0,
  ): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>> {
    const { data, error } = await createFolder({ parentFolderUuid, plainName });
    if (data) {
      return right(mapToFolderPersistedDto(data));
    }
    if (error) {
      if (error.cause === 'BAD_REQUEST' && attempt < HttpRemoteFileSystem.MAX_RETRIES) {
        logger.debug({ msg: 'Folder Creation failed with code 400' });
        await new Promise((resolve) => {
          setTimeout(resolve, 1_000);
        });
        logger.debug({ msg: 'Retrying' });
        return this.persist(plainName, parentFolderUuid, attempt + 1);
      }
      if (error.cause === 'BAD_REQUEST') {
        return left('WRONG_DATA');
      }
      if (error.cause === 'CONFLICT') {
        return left('ALREADY_EXISTS');
      }
    }
    return left('UNHANDLED');
  }
}

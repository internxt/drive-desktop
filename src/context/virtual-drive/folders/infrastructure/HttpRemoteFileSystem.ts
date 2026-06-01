import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Either, left, right } from '../../../shared/domain/Either';
import { Folder } from '../domain/Folder';
import { FolderId } from '../domain/FolderId';
import { FolderPath } from '../domain/FolderPath';
import { FolderPersistedDto, RemoteFileSystem } from '../domain/file-systems/RemoteFileSystem';
import { DriveDesktopError } from '../../../shared/domain/errors/DriveDesktopError';
import { parseRetryAfterMs } from '../../../../backend/common/rate-limit/transient-error-handler';
import { mapToFolderPersistedDto } from '../../utils/map-to-folder-persisted-dto';
import { createFolder } from '../../../../infra/drive-server/services/folder/services/create-folder';
import { searchFolder } from '../../../../infra/drive-server/services/folder/services/search-folder';
import { FolderDto } from '../../../../infra/drive-server/out/dto';

@Service()
export class HttpRemoteFileSystem implements RemoteFileSystem {
  private static PAGE_SIZE = 50;

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

  async persist(plainName: string, parentFolderUuid: string): Promise<Either<DriveDesktopError, FolderPersistedDto>> {
    const { data, error } = await createFolder({ parentFolderUuid, plainName });
    if (data) {
      return right(mapToFolderPersistedDto(data));
    }
    if (error) {
      if (error.cause === 'BAD_REQUEST') {
        return left(new DriveDesktopError('BAD_REQUEST'));
      }
      if (error.cause === 'CONFLICT') {
        return left(new DriveDesktopError('FILE_ALREADY_EXISTS'));
      }
      if (error.cause === 'TOO_MANY_REQUESTS') {
        return left(new DriveDesktopError('RATE_LIMITED', String(parseRetryAfterMs(error.message))));
      }
      if (error.cause === 'NETWORK_ERROR' || error.cause === 'SERVER_ERROR') {
        return left(new DriveDesktopError('INTERNAL_SERVER_ERROR'));
      }

      return left(new DriveDesktopError('UNKNOWN'));
    }
    return left(new DriveDesktopError('UNKNOWN'));
  }
}

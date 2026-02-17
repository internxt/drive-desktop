import { findBackupFolderByName } from './find-backup-folder-by-name';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { DriveServerError } from '../../../infra/drive-server/drive-server.error';
import { GetFolderContentDto } from '../../../infra/drive-server/out/dto';
import { call } from 'tests/vitest/utils.helper';

vi.mock('../../../infra/drive-server/services/folder/services/fetch-folder');

const mockedFetchFolder = vi.mocked(fetchFolder);

describe('findBackupFolderByName', () => {
  it('should return backup info when child folder with the same name exists', async () => {
    mockedFetchFolder.mockResolvedValue({
      data: {
        children: [
          { id: 1, plainName: 'Documents', uuid: 'documents-uuid' },
          { id: 2, plainName: 'Photos', uuid: 'photos-uuid' },
        ],
      } as unknown as GetFolderContentDto,
    });

    const result = await findBackupFolderByName({
      deviceUuid: 'device-uuid',
      folderName: 'Photos',
    });

    call(mockedFetchFolder).toStrictEqual('device-uuid');
    expect(result).toStrictEqual({
      id: 2,
      name: 'Photos',
      uuid: 'photos-uuid',
    });
  });

  it('should return undefined when fetchFolder returns an error', async () => {
    mockedFetchFolder.mockResolvedValue({
      error: new DriveServerError('NETWORK_ERROR'),
    });

    const result = await findBackupFolderByName({
      deviceUuid: 'device-uuid',
      folderName: 'Photos',
    });

    expect(result).toBeUndefined();
  });

  it('should return undefined when no child folder matches by name', async () => {
    mockedFetchFolder.mockResolvedValue({
      data: {
        children: [
          { id: 1, plainName: 'Documents', uuid: 'documents-uuid' },
          { id: 2, plainName: 'Music', uuid: 'music-uuid' },
        ],
      } as unknown as GetFolderContentDto,
    });

    const result = await findBackupFolderByName({
      deviceUuid: 'device-uuid',
      folderName: 'Photos',
    });

    expect(result).toBeUndefined();
  });
});

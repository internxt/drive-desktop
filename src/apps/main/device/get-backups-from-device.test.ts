import { partialSpyOn, mockProps, deepMocked } from '@/tests/vitest/utils.helper.test';
import { getBackupsFromDevice } from './get-backups-from-device';
import * as serviceModule from './service';
import * as backupFolderUuidModule from './backup-folder-uuid';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import configStore from '../config';
import { app } from 'electron';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('getBackupsFromDevice', () => {
  const props = mockProps<typeof getBackupsFromDevice>({ bucket: 'bucket-1' });
  const backupChild = { id: 1, uuid: 'folder-uuid' };
  const folder = { children: [backupChild] };
  const fetchFolderMock = deepMocked(driveServerWip.backup.fetchFolder);

  const findBackupPathnameFromIdMock = partialSpyOn(serviceModule, 'findBackupPathnameFromId');
  const backupFolderUuidMock = partialSpyOn(backupFolderUuidModule, 'BackupFolderUuid');
  const configStoreMock = partialSpyOn(configStore, 'get');
  const getPathMock = partialSpyOn(app, 'getPath');

  it('should return filtered and mapped backups when isCurrent is true', async () => {
    fetchFolderMock.mockResolvedValueOnce({ data: folder });
    findBackupPathnameFromIdMock.mockReturnValueOnce('/path/to/backup1');
    backupFolderUuidMock.mockImplementationOnce(() => ({
      ensureBackupUuidExists: vi.fn(),
    }));

    configStoreMock.mockReturnValueOnce({ '/path/to/backup1': { enabled: true } });
    getPathMock.mockReturnValueOnce('/tmp');

    const result = await getBackupsFromDevice(props, true);
    expect(result).toStrictEqual([
      {
        ...backupChild,
        pathname: '/path/to/backup1',
        folderId: 1,
        folderUuid: 'folder-uuid',
        tmpPath: '/tmp',
        backupsBucket: 'bucket-1',
      },
    ]);
  });

  it('should return mapped backups when isCurrent is false', async () => {
    fetchFolderMock.mockResolvedValueOnce({ data: folder });
    const result = await getBackupsFromDevice(props, false);
    expect(result).toStrictEqual([
      {
        ...backupChild,
        folderId: 1,
        folderUuid: 'folder-uuid',
        backupsBucket: 'bucket-1',
        tmpPath: '',
        pathname: '',
      },
    ]);
  });

  it('should throw and log error if fetchFolder fails', async () => {
    const error = new Error('fetch error');
    fetchFolderMock.mockRejectedValue(error);

    await expect(getBackupsFromDevice(props, true)).rejects.toThrow('error getting backups');
  });

  it('should throw and log error if folder is null or error is present', async () => {
    const error = new Error('folder fetch failed');
    fetchFolderMock.mockResolvedValueOnce({ error });

    await expect(getBackupsFromDevice(props, true)).rejects.toThrow('folder fetch failed');
  });
});

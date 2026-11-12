import { app } from 'electron';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { partialSpyOn, mockProps } from '@/tests/vitest/utils.helper.test';
import configStore from '../config';
import { getBackupsFromDevice } from './get-backups-from-device';
import * as migrateModule from './migrate-backup-folder-to-uuids';
import * as serviceModule from './service';

describe('getBackupsFromDevice', () => {
  let props: Parameters<typeof getBackupsFromDevice>[0];
  const backupChild = { id: 1, uuid: 'folder-uuid' };
  const folder = { children: [backupChild] };
  const fetchFolderMock = partialSpyOn(driveServerWip.backup, 'fetchFolder');

  const migrateBackupFolderToUuidsMock = partialSpyOn(migrateModule, 'migrateBackupFolderToUuids');
  const findBackupPathnameFromUuidMock = partialSpyOn(serviceModule, 'findBackupPathnameFromUuid');
  const configStoreMock = partialSpyOn(configStore, 'get');
  const getPathMock = partialSpyOn(app, 'getPath');

  beforeEach(() => {
    props = mockProps<typeof getBackupsFromDevice>({ device: {} });
  });

  it('should return filtered and mapped backups when isCurrent is true', async () => {
    fetchFolderMock.mockResolvedValueOnce({ data: folder });
    findBackupPathnameFromUuidMock.mockReturnValueOnce('/path/to/backup1');

    configStoreMock.mockReturnValueOnce({ '/path/to/backup1': { enabled: true } });
    getPathMock.mockReturnValueOnce('/tmp');

    props.isCurrent = true;
    const result = await getBackupsFromDevice(props);
    expect(migrateBackupFolderToUuidsMock).toHaveBeenCalledWith({ children: folder.children });
    expect(findBackupPathnameFromUuidMock).toHaveBeenCalledWith('folder-uuid');
    expect(result).toStrictEqual([
      {
        ...backupChild,
        pathname: '/path/to/backup1',
        folderUuid: 'folder-uuid',
      },
    ]);
  });

  it('should return mapped backups when isCurrent is false', async () => {
    fetchFolderMock.mockResolvedValueOnce({ data: folder });
    props.isCurrent = false;
    const result = await getBackupsFromDevice(props);
    expect(migrateBackupFolderToUuidsMock).not.toHaveBeenCalled();
    expect(result).toStrictEqual([
      {
        ...backupChild,
        folderUuid: 'folder-uuid',
        pathname: '',
      },
    ]);
  });

  it('should throw and log error if fetchFolder fails', async () => {
    const error = new Error('fetch error');
    fetchFolderMock.mockRejectedValue(error);
    props.isCurrent = true;
    await expect(getBackupsFromDevice(props)).rejects.toThrow('error getting backups');
  });

  it('should throw and log error if folder is null or error is present', async () => {
    const error = new Error('folder fetch failed');
    fetchFolderMock.mockResolvedValueOnce({ error });

    props.isCurrent = true;
    await expect(getBackupsFromDevice(props)).rejects.toThrow('folder fetch failed');
  });
});

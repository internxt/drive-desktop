import * as createBackupModule from './create-backup';
import * as DeviceModuleModule from '../device/device.module';
import configStoreModule from '../../../apps/main/config';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { call, calls, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { createBackupsFromLocalPaths } from './create-backups-from-local-paths';

describe('create-backups-from-local-paths', () => {
  const createBackupMock = partialSpyOn(createBackupModule, 'createBackup');
  const getOrCreateDeviceMock = partialSpyOn(DeviceModuleModule.DeviceModule, 'getOrCreateDevice');
  const configStoreSetMock = partialSpyOn(configStoreModule, 'set');

  it('should enable backups and create one backup per local path', async () => {
    const device = {
      id: 1,
      uuid: 'device-uuid',
      name: 'Device',
      bucket: 'bucket',
      removed: false,
      hasBackups: true,
    };

    const folderPaths = [createAbsolutePath('/home/dev/Documents'), createAbsolutePath('/home/dev/Pictures')];

    getOrCreateDeviceMock.mockResolvedValue({ data: device });
    createBackupMock.mockResolvedValue(undefined as never);

    const result = await createBackupsFromLocalPaths({ folderPaths });

    expect(result).toStrictEqual({ data: true });
    call(configStoreSetMock).toStrictEqual(['backupsEnabled', true]);
    call(getOrCreateDeviceMock).toStrictEqual([]);
    calls(createBackupMock).toStrictEqual([
      { pathname: folderPaths[0], device },
      { pathname: folderPaths[1], device },
    ]);
  });

  it('should return an error when no device can be created or fetched', async () => {
    const error = new Error('Device error');
    const folderPaths = [createAbsolutePath('/home/dev/Documents')];

    getOrCreateDeviceMock.mockResolvedValue({ error });

    await expect(createBackupsFromLocalPaths({ folderPaths })).resolves.toStrictEqual({ error });
    calls(createBackupMock).toHaveLength(0);
    calls(configStoreSetMock).toHaveLength(0);
  });

  it('should return an error when creating a backup fails', async () => {
    const error = new Error('Backup error');
    const device = {
      id: 1,
      uuid: 'device-uuid',
      name: 'Device',
      bucket: 'bucket',
      removed: false,
      hasBackups: true,
    };
    const folderPaths = [createAbsolutePath('/home/dev/Documents')];

    getOrCreateDeviceMock.mockResolvedValue({ data: device });
    createBackupMock.mockRejectedValue(error);

    await expect(createBackupsFromLocalPaths({ folderPaths })).rejects.toThrow('Backup error');
    call(createBackupMock).toStrictEqual({ pathname: folderPaths[0], device });
    calls(configStoreSetMock).toHaveLength(0);
  });
});

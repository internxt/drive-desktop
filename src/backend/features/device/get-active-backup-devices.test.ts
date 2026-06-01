import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { getActiveBackupDevices } from './get-active-backup-devices';

describe('get-active-backup-devices', () => {
  const getDevicesMock = partialSpyOn(driveServerModule.backup, 'getDevices');

  it('should return only active devices with backups', async () => {
    getDevicesMock.mockResolvedValue({
      isLeft: () => false,
      getRight: () => [
        { id: 1, uuid: '1', name: 'a', bucket: 'b', removed: false, hasBackups: true },
        { id: 2, uuid: '2', name: 'b', bucket: 'b', removed: true, hasBackups: true },
        { id: 3, uuid: '3', name: 'c', bucket: 'b', removed: false, hasBackups: false },
      ],
    } as never);

    const result = await getActiveBackupDevices();

    expect(result).toStrictEqual([{ id: 1, uuid: '1', name: 'a', bucket: 'b', removed: false, hasBackups: true }]);
  });

  it('should return empty array when service returns left response', async () => {
    getDevicesMock.mockResolvedValue({ isLeft: () => true, getLeft: () => new Error('left error') } as never);

    const result = await getActiveBackupDevices();

    expect(result).toStrictEqual([]);
  });
});

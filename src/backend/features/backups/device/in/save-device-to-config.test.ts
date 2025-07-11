import { beforeEach, describe, vi } from 'vitest';
import { deepMocked } from '../../../../../../tests/vitest/utils.helper.test';
import configStore from '@/apps/main/config';
import { saveDeviceToConfig } from '@/backend/features/backups/device/in/save-device-to-config';

vi.mock('@/apps/main/config');

describe('saveDeviceToConfig', () => {
  const configStoreMock = deepMocked(configStore.set);

  const deviceMock = {
    name: 'encrypted-name',
    id: 1,
    uuid: 'test-uuid',
    bucket: 'test-bucket',
    removed: false,
    hasBackups: true,
    lastBackupAt: '2023-01-01',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should save device ID, UUID and create empty backup list in the config store', () => {
    saveDeviceToConfig(deviceMock);

    expect(configStoreMock).toHaveBeenCalledTimes(3);
    expect(configStoreMock).toHaveBeenCalledWith('deviceId', 1);
    expect(configStoreMock).toHaveBeenCalledWith('deviceUuid', 'test-uuid');
    expect(configStoreMock).toHaveBeenCalledWith('backupList', {});
  });
});

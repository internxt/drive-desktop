import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authServiceModule from '@/apps/main/auth/service';
import * as configModule from '@/apps/main/config';
import { fieldsToSave } from '@/core/electron/store/fields-to-save';
import { saveConfig } from './save-config';

describe('saveConfig', () => {
  const getUserMock = partialSpyOn(authServiceModule, 'getUser');
  const configGetMock = vi.spyOn(configModule.default, 'get');
  const configSetMock = vi.spyOn(configModule.default, 'set');

  it('should return early when user is not available', () => {
    getUserMock.mockReturnValue(null);

    const result = saveConfig();

    expect(result).toBeUndefined();
    expect(configGetMock).not.toHaveBeenCalled();
    expect(configSetMock).not.toHaveBeenCalled();
  });

  it('should return early when user has no uuid', () => {
    getUserMock.mockReturnValue({ uuid: undefined });

    const result = saveConfig();

    expect(result).toBeUndefined();
    expect(configGetMock).not.toHaveBeenCalled();
    expect(configSetMock).not.toHaveBeenCalled();
  });

  it('should save current config values for current user', () => {
    getUserMock.mockReturnValue({ uuid: 'current-user-uuid' });

    const currentUserConfigs = {
      backupsEnabled: true,
      backupInterval: 3600,
      lastBackup: '2024-01-15',
      syncRoot: '/Users/john/Internxt',
      lastSync: '2024-01-16',
      deviceId: 'laptop-001',
      deviceUuid: 'uuid-laptop-001',
      backupList: ['Documents', 'Pictures'],
    };

    const existingConfigs = {
      'previous-user-uuid': { backupsEnabled: false },
    };

    configGetMock.mockImplementation((key: string) => {
      if (key === 'savedConfigs') return existingConfigs;
      return currentUserConfigs[key as keyof typeof currentUserConfigs];
    });

    saveConfig();

    expect(configGetMock).toHaveBeenCalledWith('savedConfigs');
    fieldsToSave.forEach((field) => {
      expect(configGetMock).toHaveBeenCalledWith(field);
    });

    expect(configSetMock).toHaveBeenCalledWith('savedConfigs', {
      'previous-user-uuid': { backupsEnabled: false },
      'current-user-uuid': currentUserConfigs,
    });
  });

  it('should create savedConfigs when none exist', () => {
    getUserMock.mockReturnValue({ uuid: 'new-user-uuid' });

    const firstTimeUserConfigs = {
      backupsEnabled: false,
      backupInterval: 1800,
      lastBackup: null,
      syncRoot: undefined,
      lastSync: '2024-01-01',
      deviceId: 'mobile-001',
      deviceUuid: 'uuid-mobile-001',
      backupList: [],
    };

    configGetMock.mockImplementation((key) => {
      if (key === 'savedConfigs') return undefined;
      return firstTimeUserConfigs[key as keyof typeof firstTimeUserConfigs];
    });

    saveConfig();

    expect(configSetMock).toHaveBeenCalledWith('savedConfigs', {
      'new-user-uuid': firstTimeUserConfigs,
    });
  });

  it('should replace existing user config with updated values', () => {
    getUserMock.mockReturnValue({ uuid: 'returning-user-uuid' });
    const outdatedConfigs = {
      'returning-user-uuid': {
        backupsEnabled: false,
        backupInterval: 1800,
        syncRoot: '/old/path',
      },
      'another-user-uuid': { backupsEnabled: true },
    };

    const updatedUserConfigs = {
      backupsEnabled: true,
      backupInterval: 7200,
      lastBackup: '2024-01-20',
      syncRoot: '/Users/jane/Internxt',
      lastSync: '2024-01-21',
      deviceId: 'desktop-002',
      deviceUuid: 'uuid-desktop-002',
      backupList: ['Work Files'],
    };

    configGetMock.mockImplementation((key) => {
      if (key === 'savedConfigs') return outdatedConfigs;
      return updatedUserConfigs[key as keyof typeof updatedUserConfigs];
    });

    saveConfig();

    expect(configSetMock).toHaveBeenCalledWith('savedConfigs', {
      'returning-user-uuid': updatedUserConfigs,
      'another-user-uuid': { backupsEnabled: true },
    });
  });

  it('should retrieve all fields specified in fieldsToSave constant', () => {
    getUserMock.mockReturnValue({ uuid: 'validation-user-uuid' });
    const allRequiredFields = [
      'backupsEnabled',
      'backupInterval',
      'lastBackup',
      'syncRoot',
      'lastSync',
      'deviceId',
      'deviceUuid',
      'backupList',
    ];

    configGetMock.mockImplementation((key: string) => {
      if (key === 'savedConfigs') return {};
      return `mocked-${key}`;
    });

    saveConfig();

    allRequiredFields.forEach((field) => {
      expect(configGetMock).toHaveBeenCalledWith(field);
    });
    expect(configGetMock).toHaveBeenCalledTimes(allRequiredFields.length + 1);
  });
});

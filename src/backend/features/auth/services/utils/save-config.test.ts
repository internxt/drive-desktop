import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as authServiceModule from '@/apps/main/auth/service';
import { saveConfig } from './save-config';
import { fieldsToSave } from '@/core/electron/store/defaults';
import electronStore from '@/apps/main/config';

describe('saveConfig', () => {
  const getUserMock = partialSpyOn(authServiceModule, 'getUser');
  const configGetMock = partialSpyOn(electronStore, 'get');
  const configSetMock = partialSpyOn(electronStore, 'set');

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
      backupInterval: 3600,
      lastBackup: '2024-01-15',
      syncRoot: '/Users/john/Internxt',
      deviceUuid: 'uuid-laptop-001',
      backupList: ['Documents', 'Pictures'],
    };

    const existingConfigs = {
      'previous-user-uuid': { backupsEnabled: false },
    };

    configGetMock.mockImplementation((key): any => {
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
      backupInterval: 1800,
      lastBackup: null,
      syncRoot: undefined,
      deviceUuid: 'uuid-mobile-001',
      backupList: [],
    };

    configGetMock.mockImplementation((key): any => {
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
        backupInterval: 1800,
        syncRoot: '/old/path',
      },
      'another-user-uuid': { backupsEnabled: true },
    };

    const updatedUserConfigs = {
      backupInterval: 7200,
      lastBackup: '2024-01-20',
      syncRoot: '/Users/jane/Internxt',
      deviceUuid: 'uuid-desktop-002',
      backupList: ['Work Files'],
    };

    configGetMock.mockImplementation((key): any => {
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

    configGetMock.mockImplementation((key: string) => {
      if (key === 'savedConfigs') return {};
      return `mocked-${key}`;
    });

    saveConfig();

    fieldsToSave.forEach((field) => {
      expect(configGetMock).toHaveBeenCalledWith(field);
    });
    expect(configGetMock).toHaveBeenCalledTimes(fieldsToSave.length + 1);
  });
});

import { resetConfig } from './reset-config';
import * as configModule from '@/apps/main/config';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('resetConfig', () => {
  const configSetMock = partialSpyOn(configModule.default, 'set');

  it('should reset all fields in fieldsToSave to their default values', () => {
    resetConfig();

    expect(configSetMock).toBeCalledWith('backupsEnabled', false);
    expect(configSetMock).toBeCalledWith('backupInterval', 86_400_000);
    expect(configSetMock).toBeCalledWith('lastBackup', -1);
    expect(configSetMock).toBeCalledWith('syncRoot', '');
    expect(configSetMock).toBeCalledWith('deviceId', -1);
    expect(configSetMock).toBeCalledWith('backupList', {});
    expect(configSetMock).toBeCalledTimes(6);
  });
});

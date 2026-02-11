import configStore from '@/apps/main/config';
import { resetConfig } from './reset-config';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('resetConfig', () => {
  const configSetMock = partialSpyOn(configStore, 'set');

  it('should reset all fields to their default values', () => {
    resetConfig();

    calls(configSetMock).toStrictEqual([
      ['backupInterval', 86400000],
      ['lastBackup', -1],
      ['syncRoot', ''],
      ['deviceUuid', ''],
      ['backupList', {}],
      ['newToken', ''],
      ['userData', {}],
      ['mnemonic', ''],
    ]);
  });
});

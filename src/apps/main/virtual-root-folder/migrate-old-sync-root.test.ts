import { existsSync, renameSync } from 'node:fs';
import { migrateOldSyncRoot } from './migrate-old-sync-root';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { PATHS } from '@/core/electron/paths';
import configStore from '../config';

vi.mock(import('node:fs'));

describe('migrate-old-sync-root', () => {
  const existsSyncMock = vi.mocked(existsSync);
  const renameSyncMock = vi.mocked(renameSync);
  const setMock = partialSpyOn(configStore, 'set');

  const props = mockProps<typeof migrateOldSyncRoot>({ user: { uuid: 'uuid' } });
  PATHS.HOME_FOLDER_PATH = 'C:/Users/user';

  afterEach(() => {
    call(setMock).toStrictEqual(['syncRoot', 'C:/Users/user/InternxtDrive - uuid']);
  });

  it('should skip if new sync root folder already exists', () => {
    // Given
    existsSyncMock.mockReturnValueOnce(true);
    // When
    migrateOldSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate old sync root' }, { msg: 'New sync root already exists, skiping' }]);
  });

  it('should set a new syncRoot when the user changes the root', () => {
    // Given
    existsSyncMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
    // When
    migrateOldSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate old sync root' }, { msg: 'Migrate old sync root' }]);
    calls(renameSyncMock).toHaveLength(1);
  });

  it('should set a new syncRoot when the user changes the root', () => {
    // Given
    existsSyncMock.mockReturnValue(false);
    // When
    migrateOldSyncRoot(props);
    // Then
    calls(loggerMock.debug).toMatchObject([{ msg: 'Check migrate old sync root' }, { msg: 'Old sync root does not exist, skiping' }]);
  });
});

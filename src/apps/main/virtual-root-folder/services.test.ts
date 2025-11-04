import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { configStore } from '../config';
import { getRootVirtualDrive } from './service';
import * as getUserOrThrowModule from '../auth/service';
import * as migrateOldSyncRootModule from './migrate-old-sync-root';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '@/core/electron/paths';

describe('getRootVirtualDrive', () => {
  const getUserOrThrowMock = partialSpyOn(getUserOrThrowModule, 'getUserOrThrow');
  const getMock = partialSpyOn(configStore, 'get');
  const migrateOldSyncRootMock = partialSpyOn(migrateOldSyncRootModule, 'migrateOldSyncRoot');

  const absolutePath = createAbsolutePath('C:/Users/user/InternxtDrive - uuid');

  beforeEach(() => {
    getUserOrThrowMock.mockReturnValue({ uuid: 'uuid' });
  });

  it('should use default sync root in case of empty', () => {
    // Given
    PATHS.HOME_FOLDER_PATH = 'C:/Users/user/';
    getMock.mockReturnValue('');
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
    calls(migrateOldSyncRootMock).toHaveLength(0);
  });

  it('should migrate the syncRoot if it is the old one', () => {
    // Given
    getMock.mockReturnValue(migrateOldSyncRootModule.OLD_SYNC_ROOT);
    migrateOldSyncRootMock.mockReturnValue(absolutePath);
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
    calls(migrateOldSyncRootMock).toHaveLength(1);
  });

  it('should return the current syncRoot', () => {
    // Given
    getMock.mockReturnValue(absolutePath);
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
    calls(migrateOldSyncRootMock).toHaveLength(0);
  });
});

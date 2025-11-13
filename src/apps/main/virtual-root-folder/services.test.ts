import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { electronStore } from '../config';
import { getRootVirtualDrive, OLD_SYNC_ROOT } from './service';
import * as getUserOrThrowModule from '../auth/service';
import * as migrateSyncRootModule from './migrate-sync-root';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PATHS } from '@/core/electron/paths';

describe('getRootVirtualDrive', () => {
  const getUserOrThrowMock = partialSpyOn(getUserOrThrowModule, 'getUserOrThrow');
  const getMock = partialSpyOn(electronStore, 'get');
  const migrateSyncRootMock = partialSpyOn(migrateSyncRootModule, 'migrateSyncRoot');

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
    calls(migrateSyncRootMock).toHaveLength(0);
  });

  it('should migrate the syncRoot if it is the old one', () => {
    // Given
    getMock.mockReturnValue(OLD_SYNC_ROOT);
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
    calls(migrateSyncRootMock).toHaveLength(1);
  });

  it('should return the current syncRoot', () => {
    // Given
    getMock.mockReturnValue(absolutePath);
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
    calls(migrateSyncRootMock).toHaveLength(0);
  });
});

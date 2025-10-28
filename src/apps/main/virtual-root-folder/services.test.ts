import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { configStore } from '../config';
import { getRootVirtualDrive, OLD_SYNC_ROOT } from './service';
import * as getUserOrThrowModule from '../auth/service';
import * as migrateSyncRootModule from './migrate-sync-root';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('getRootVirtualDrive', () => {
  partialSpyOn(getUserOrThrowModule, 'getUserOrThrow');
  const getMock = partialSpyOn(configStore, 'get');
  const migrateSyncRootMock = partialSpyOn(migrateSyncRootModule, 'migrateSyncRoot');

  const absolutePath = createAbsolutePath('C:/Users/user/InternxtDrive - uuid');

  it('should migrate the syncRoot if it is the old one', () => {
    // Given
    getMock.mockReturnValue(OLD_SYNC_ROOT);
    migrateSyncRootMock.mockReturnValue(absolutePath);
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
  });

  it('should return the current syncRoot', () => {
    // Given
    getMock.mockReturnValue(absolutePath);
    // When
    const res = getRootVirtualDrive();
    // Then
    expect(res).toBe(absolutePath);
  });
});

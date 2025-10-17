import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { configStore } from '../config';
import { getRootVirtualDrive } from './service';
import * as getUserOrThrowModule from '../auth/service';
import * as migrateOldSyncRootModule from './migrate-old-sync-root';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('getRootVirtualDrive', () => {
  partialSpyOn(getUserOrThrowModule, 'getUserOrThrow');
  const getMock = partialSpyOn(configStore, 'get');
  const migrateOldSyncRootMock = partialSpyOn(migrateOldSyncRootModule, 'migrateOldSyncRoot');

  const absolutePath = createAbsolutePath('C:/Users/user/InternxtDrive - uuid');

  beforeEach(() => {});

  it('should migrate the syncRoot if it is the old one', () => {
    // Given
    getMock.mockReturnValue(migrateOldSyncRootModule.OLD_SYNC_ROOT);
    migrateOldSyncRootMock.mockReturnValue(absolutePath);
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

import * as issuesModule from '@/apps/main/background-processes/issues';
import * as storeModule from '@/apps/main/remote-sync/store';
import { SyncContext } from '@/apps/sync-engine/config';
import * as addPendingItemsModule from '@/apps/sync-engine/in/add-pending-items';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { retryRejectedUploads } from './retry-rejected-uploads';

describe('retry-rejected-uploads', () => {
  const removeSyncIssuesByErrorMock = partialSpyOn(issuesModule, 'removeSyncIssuesByError');
  const getSyncContextsMock = partialSpyOn(storeModule, 'getSyncContexts');
  const addPendingItemsMock = partialSpyOn(addPendingItemsModule, 'addPendingItems');

  const ctx1 = { workspaceId: '' } as SyncContext;
  const ctx2 = { workspaceId: 'workspaceId' } as SyncContext;

  beforeEach(() => {
    removeSyncIssuesByErrorMock.mockReturnValue(true);
    getSyncContextsMock.mockReturnValue([ctx1, ctx2]);
    addPendingItemsMock.mockResolvedValue();
  });

  it('should add the pending items of every sync context', async () => {
    // When
    await retryRejectedUploads();
    // Then
    call(removeSyncIssuesByErrorMock).toStrictEqual({ error: 'FILE_SIZE_TOO_BIG' });
    calls(addPendingItemsMock).toStrictEqual([{ ctx: ctx1 }, { ctx: ctx2 }]);
  });

  it('should not add the pending items if no file was rejected for its size', async () => {
    // Given
    removeSyncIssuesByErrorMock.mockReturnValue(false);
    // When
    await retryRejectedUploads();
    // Then
    calls(addPendingItemsMock).toHaveLength(0);
  });

  it('should share the retry in progress between overlapping calls', async () => {
    // Given
    const { promise, resolve } = Promise.withResolvers<void>();
    addPendingItemsMock.mockReturnValue(promise);
    // When
    const first = retryRejectedUploads();
    const second = retryRejectedUploads();
    resolve();
    await Promise.all([first, second]);
    // Then
    expect(second).toBe(first);
    calls(addPendingItemsMock).toHaveLength(2);
  });

  it('should retry again once the previous retry has finished', async () => {
    // When
    await retryRejectedUploads();
    await retryRejectedUploads();
    // Then
    calls(addPendingItemsMock).toHaveLength(4);
  });
});

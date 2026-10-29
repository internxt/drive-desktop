import { existsSync } from 'node:fs';
import { addBackupsIssue, addSyncIssue, clearIssues, issues } from '@/apps/main/background-processes/issues';
import * as getSyncContextFromPathModule from '@/apps/main/electron/share/get-sync-context-from-path';
import { SyncContext } from '@/apps/sync-engine/config';
import * as addPendingItemsModule from '@/apps/sync-engine/in/add-pending-items';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFileInfoError } from '@/infra/node-win/services/get-file-info';
import { calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { retryRejectedUploads } from './retry-rejected-uploads';

vi.mock(import('node:fs'));

describe('retry-rejected-uploads', () => {
  const existsSyncMock = vi.mocked(existsSync);
  const getSyncContextFromPathMock = partialSpyOn(getSyncContextFromPathModule, 'getSyncContextFromPath');
  const getFileInfoMock = partialSpyOn(NodeWin, 'getFileInfo');
  const addPendingItemsMock = partialSpyOn(addPendingItemsModule, 'addPendingItems');

  const ctx1 = { workspaceId: '' } as SyncContext;
  const ctx2 = { workspaceId: 'workspaceId' } as SyncContext;

  beforeEach(() => {
    clearIssues();
    existsSyncMock.mockReturnValue(true);
    getSyncContextFromPathMock.mockImplementation((path) => (path.startsWith('/workspace') ? ctx2 : ctx1));
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('NOT_A_PLACEHOLDER') });
    addPendingItemsMock.mockResolvedValue();
  });

  it('should remove the issues of the new files and add the pending items of their sync contexts', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    addSyncIssue({ name: '/workspace/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    addSyncIssue({ name: '/other.iso', error: 'FILE_SIZE_TOO_BIG' });
    addSyncIssue({ name: '/file.iso', error: 'INVALID_WINDOWS_NAME' });
    addBackupsIssue({ name: '/file.iso', folderUuid: 'folderUuid', error: 'FILE_SIZE_TOO_BIG' });
    // When
    await retryRejectedUploads();
    // Then
    expect(issues).toStrictEqual([
      { tab: 'sync', name: '/file.iso', error: 'INVALID_WINDOWS_NAME' },
      { tab: 'backups', name: '/file.iso', folderUuid: 'folderUuid', error: 'FILE_SIZE_TOO_BIG' },
    ]);
    calls(addPendingItemsMock).toStrictEqual([{ ctx: ctx1 }, { ctx: ctx2 }]);
  });

  it('should keep the issue of a modified file because adding the pending items skips placeholders', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    getFileInfoMock.mockResolvedValue({ data: {} as never });
    // When
    await retryRejectedUploads();
    // Then
    expect(issues).toStrictEqual([{ tab: 'sync', name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' }]);
    calls(addPendingItemsMock).toHaveLength(0);
  });

  it('should keep the issue if the placeholder state cannot be read', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    getFileInfoMock.mockResolvedValue({ error: new GetFileInfoError('UNKNOWN') });
    // When
    await retryRejectedUploads();
    // Then
    expect(issues).toHaveLength(1);
    calls(addPendingItemsMock).toHaveLength(0);
  });

  it('should keep the issue of a file outside an active sync context', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    getSyncContextFromPathMock.mockReturnValue(null);
    // When
    await retryRejectedUploads();
    // Then
    expect(issues).toHaveLength(1);
    calls(addPendingItemsMock).toHaveLength(0);
  });

  it('should remove the issue of a file that no longer exists without retrying it', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    existsSyncMock.mockReturnValue(false);
    // When
    await retryRejectedUploads();
    // Then
    expect(issues).toHaveLength(0);
    calls(getFileInfoMock).toHaveLength(0);
    calls(addPendingItemsMock).toHaveLength(0);
  });

  it('should not add the pending items if no file was rejected for its size', async () => {
    // When
    await retryRejectedUploads();
    // Then
    calls(addPendingItemsMock).toHaveLength(0);
  });

  it('should share the retry in progress between overlapping calls', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    const { promise, resolve } = Promise.withResolvers<void>();
    addPendingItemsMock.mockReturnValue(promise);
    // When
    const first = retryRejectedUploads();
    const second = retryRejectedUploads();
    resolve();
    await Promise.all([first, second]);
    // Then
    expect(second).toBe(first);
    calls(addPendingItemsMock).toHaveLength(1);
  });

  it('should retry again once the previous retry has finished', async () => {
    // Given
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    await retryRejectedUploads();
    addSyncIssue({ name: '/file.iso', error: 'FILE_SIZE_TOO_BIG' });
    // When
    await retryRejectedUploads();
    // Then
    calls(addPendingItemsMock).toHaveLength(2);
  });
});

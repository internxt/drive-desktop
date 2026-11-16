import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as fetchModule from './fetch-recovery-sync-page';
import * as repairModule from './repair-recovery-sync-items';
import { scanRecoverySyncFolders } from './scan-recovery-sync-folders';
import * as scanItemsModule from './scan-recovery-sync-items';

describe('scan-recovery-sync-folders', () => {
  const scanItemsMock = partialSpyOn(scanItemsModule, 'scanRecoverySyncItems');
  const fetchFoldersMock = partialSpyOn(fetchModule, 'fetchRecoverySyncFoldersPage');
  const repairFoldersMock = partialSpyOn(repairModule, 'repairRecoverySyncFolders');

  const { ctx } = mockProps<typeof scanRecoverySyncFolders>({ ctx: { workspaceId: 'workspaceId' } });

  beforeEach(() => {
    scanItemsMock.mockResolvedValue({ data: undefined });
    fetchFoldersMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    repairFoldersMock.mockResolvedValue({ data: undefined });
  });

  it('should scan folders and return the scan result', async () => {
    // Given
    const error = new Error('scan failed');
    scanItemsMock.mockResolvedValue({ error });
    // When
    const result = await scanRecoverySyncFolders({ ctx });
    // Then
    expect(result.error).toBe(error);
    call(scanItemsMock).toMatchObject({ ctx, itemType: 'folder' });
  });

  it('should fetch and repair folder pages with the context', async () => {
    // Given
    await scanRecoverySyncFolders({ ctx });
    const { fetchPage, repairItems } = scanItemsMock.mock.calls[0][0];
    // When
    await fetchPage({ request: { updatedAt: '1970-01-01T00:00:00.000Z' } });
    await repairItems({ items: [], checkpoint: 'checkpoint' });
    // Then
    call(fetchFoldersMock).toStrictEqual({ ctx, request: { updatedAt: '1970-01-01T00:00:00.000Z' } });
    call(repairFoldersMock).toStrictEqual({ ctx, items: [], checkpoint: 'checkpoint' });
  });
});

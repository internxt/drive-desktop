import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as fetchModule from './fetch-recovery-sync-page';
import * as repairModule from './repair-recovery-sync-items';
import { scanRecoverySyncFiles } from './scan-recovery-sync-files';
import * as scanItemsModule from './scan-recovery-sync-items';

describe('scan-recovery-sync-files', () => {
  const scanItemsMock = partialSpyOn(scanItemsModule, 'scanRecoverySyncItems');
  const fetchFilesMock = partialSpyOn(fetchModule, 'fetchRecoverySyncFilesPage');
  const repairFilesMock = partialSpyOn(repairModule, 'repairRecoverySyncFiles');

  const { ctx } = mockProps<typeof scanRecoverySyncFiles>({ ctx: { workspaceId: 'workspaceId' } });

  beforeEach(() => {
    scanItemsMock.mockResolvedValue({ data: undefined });
    fetchFilesMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    repairFilesMock.mockResolvedValue({ data: undefined });
  });

  it('should scan files and return the scan result', async () => {
    // Given
    const error = new Error('scan failed');
    scanItemsMock.mockResolvedValue({ error });
    // When
    const result = await scanRecoverySyncFiles({ ctx });
    // Then
    expect(result.error).toBe(error);
    call(scanItemsMock).toMatchObject({ ctx, itemType: 'file' });
  });

  it('should fetch and repair file pages with the context', async () => {
    // Given
    await scanRecoverySyncFiles({ ctx });
    const { fetchPage, repairItems } = scanItemsMock.mock.calls[0][0];
    // When
    await fetchPage({ request: { cursor: 'cursor' } });
    await repairItems({ items: [], checkpoint: 'checkpoint' });
    // Then
    call(fetchFilesMock).toStrictEqual({ ctx, request: { cursor: 'cursor' } });
    call(repairFilesMock).toStrictEqual({ ctx, items: [], checkpoint: 'checkpoint' });
  });
});

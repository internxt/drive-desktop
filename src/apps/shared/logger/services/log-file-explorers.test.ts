import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as logFileExplorer from './log-file-explorer';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logFileExplorers } from './log-file-explorers';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { workers } from '@/apps/main/remote-sync/store';

describe('log-file-explorers', () => {
  const logFileExplorerMock = partialSpyOn(logFileExplorer, 'logFileExplorer');

  beforeEach(() => {
    workers.clear();
    workers.set('workspaceId1', { ctx: { logger: loggerMock } } as any);
    workers.set('workspaceId2', { ctx: { logger: loggerMock } } as any);
  });

  it('should return csv paths if log file explorer success', async () => {
    // Given
    logFileExplorerMock.mockResolvedValueOnce(abs('/path1')).mockResolvedValueOnce(abs('/path2'));
    // When
    const res = await logFileExplorers();
    // Then
    expect(res).toStrictEqual(['/path1', '/path2']);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should handle errors if log file explorer fails', async () => {
    // Given
    logFileExplorerMock.mockResolvedValueOnce(abs('/path1')).mockRejectedValueOnce(new Error());
    // When
    const res = await logFileExplorers();
    // Then
    expect(res).toStrictEqual(['/path1']);
    call(loggerMock.error).toMatchObject({ msg: 'Error generating file explorer csv' });
  });
});

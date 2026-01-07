import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as logFileExplorer from './log-file-explorer';
import * as getDriveContexts from '@/node-win/callbacks';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logFileExplorers } from './log-file-explorers';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('log-file-explorers', () => {
  const getDriveContextsMock = partialSpyOn(getDriveContexts, 'getDriveContexts');
  const logFileExplorerMock = partialSpyOn(logFileExplorer, 'logFileExplorer');

  beforeEach(() => {
    getDriveContextsMock.mockReturnValue([{ logger: loggerMock }, { logger: loggerMock }]);
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

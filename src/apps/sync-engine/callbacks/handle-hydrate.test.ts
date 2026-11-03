import * as issues from '@/apps/main/background-processes/issues';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';

describe('handle-hydrate', () => {
  const hydrateFileMock = partialSpyOn(Addon, 'hydrateFile');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');
  const removeSyncIssueMock = partialSpyOn(issues, 'removeSyncIssue');

  const path = abs('/folder1/folder2/file.txt');
  const props = mockProps<typeof handleHydrate>({ path });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    call(updateSyncStatusMock).toStrictEqual({ path });
    call(hydrateFileMock).toStrictEqual({ path });
    call(removeSyncIssueMock).toStrictEqual({ error: 'PINNED_FILE_NOT_DOWNLOADED', name: path });
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should keep the issue if hydration fails', async () => {
    // Given
    hydrateFileMock.mockRejectedValue(new Error('Hydration failed'));
    // When
    await handleHydrate(props);
    // Then
    calls(removeSyncIssueMock).toHaveLength(0);
  });
});

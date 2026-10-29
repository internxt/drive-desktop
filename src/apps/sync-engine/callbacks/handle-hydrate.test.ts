import Bottleneck from 'bottleneck';
import * as issues from '@/apps/main/background-processes/issues';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleHydrate, throttleHydrate } from './handle-hydrate';

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

  it('should not schedule the same file twice while it is pending', async () => {
    // Given
    let finishHydration = () => {};
    hydrateFileMock.mockReturnValue(new Promise<void>((resolve) => (finishHydration = resolve)));
    const ctx = { ...props.ctx, downloadBottleneck: new Bottleneck({ maxConcurrent: 1 }) };
    // When
    const first = throttleHydrate({ ctx, path });
    const second = throttleHydrate({ ctx, path });
    finishHydration();
    await Promise.all([first, second]);
    // Then
    calls(hydrateFileMock).toHaveLength(1);
  });

  it('should schedule the file again once the previous hydration finished', async () => {
    // Given
    const ctx = { ...props.ctx, downloadBottleneck: new Bottleneck({ maxConcurrent: 1 }) };
    // When
    await throttleHydrate({ ctx, path });
    await throttleHydrate({ ctx, path });
    // Then
    calls(hydrateFileMock).toHaveLength(2);
  });
});

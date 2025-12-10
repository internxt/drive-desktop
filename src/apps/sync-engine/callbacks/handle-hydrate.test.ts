import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';

describe('handle-hydrate', () => {
  const hydrateFileMock = partialSpyOn(Addon, 'hydrateFile');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const props = mockProps<typeof handleHydrate>({
    path: '/folder1/folder2/file.txt' as AbsolutePath,
  });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    call(updateSyncStatusMock).toStrictEqual({ path: '/folder1/folder2/file.txt' });
    call(hydrateFileMock).toStrictEqual({ path: '/folder1/folder2/file.txt' });
    calls(loggerMock.error).toHaveLength(0);
  });
});

import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { Addon } from '@/node-win/addon-wrapper';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

describe('handle-hydrate', () => {
  const hydrateFileMock = partialSpyOn(Addon, 'hydrateFile');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const path = abs('/folder1/folder2/file.txt');
  const props = mockProps<typeof handleHydrate>({ path });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    call(updateSyncStatusMock).toStrictEqual({ path });
    call(hydrateFileMock).toStrictEqual({ path });
    calls(loggerMock.error).toHaveLength(0);
  });
});

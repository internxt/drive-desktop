import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleHydrate } from './handle-hydrate';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';

describe('handle-hydrate', () => {
  const hydrateFileMock = partialSpyOn(Addon, 'hydrateFile');

  const props = mockProps<typeof handleHydrate>({
    path: '/folder1/folder2/file.txt' as AbsolutePath,
  });

  it('should call handle hydrate successfully', async () => {
    // When
    await handleHydrate(props);
    // Then
    expect(hydrateFileMock).toBeCalledWith({ path: '/folder1/folder2/file.txt' });
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});

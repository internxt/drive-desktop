import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { handleDehydrate } from './handle-dehydrate';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';

describe('handle-dehydrate', () => {
  const dehydrateFileMock = partialSpyOn(Addon, 'dehydrateFile');

  const path = '/folder/file.txt' as AbsolutePath;
  const props = mockProps<typeof handleDehydrate>({ path });

  it('should call dehydrateFile', async () => {
    // When
    await handleDehydrate(props);
    // Then
    expect(dehydrateFileMock).toBeCalledWith({ path });
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should call logger.error if dehydrateFile throws', async () => {
    // Given
    dehydrateFileMock.mockRejectedValue(new Error());
    // When
    await handleDehydrate(props);
    // Then
    expect(dehydrateFileMock).toBeCalledWith({ path });
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});

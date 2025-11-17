import { mockProps } from '@/tests/vitest/utils.helper.test';
import { handleDehydrate } from './handle-dehydrate';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

describe('handle-dehydrate', () => {
  const drive = mockDeep<VirtualDrive>();
  const path = '/folder/file.txt' as AbsolutePath;
  const props = mockProps<typeof handleDehydrate>({ drive, path });

  it('should call dehydrateFile', () => {
    // When
    handleDehydrate(props);
    // Then
    expect(drive.dehydrateFile).toBeCalledWith({ path });
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should call logger.error if dehydrateFile throws', () => {
    // Given
    drive.dehydrateFile.mockImplementationOnce(() => {
      throw new Error('error');
    });
    // When
    handleDehydrate(props);
    // Then
    expect(drive.dehydrateFile).toBeCalledWith({ path });
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});

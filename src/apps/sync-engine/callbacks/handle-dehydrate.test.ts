import { mockProps } from '@/tests/vitest/utils.helper.test';
import { handleDehydrate } from './handle-dehydrate';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';

describe('handle-dehydrate', () => {
  const drive = mockDeep<VirtualDrive>();
  const path = createRelativePath('folder', 'file.txt');
  const props = mockProps<typeof handleDehydrate>({ drive, path });

  it('should call dehydrateFile', () => {
    // When
    handleDehydrate(props);
    // Then
    expect(drive.dehydrateFile).toBeCalledWith({ itemPath: path });
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
    expect(drive.dehydrateFile).toBeCalledWith({ itemPath: path });
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});

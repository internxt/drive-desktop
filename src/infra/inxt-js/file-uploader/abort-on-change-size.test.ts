import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abortOnChangeSize } from './abort-on-change-size';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { EnvironmentFileUploaderError } from './process-error';

describe('abort-on-change-size', () => {
  const statMock = partialSpyOn(fileSystem, 'stat');

  const resolve = vi.fn();
  const stopUpload = vi.fn();
  const props = mockProps<typeof abortOnChangeSize>({ size: 1024, resolve, stopUpload });

  it('should not abort upload if size is the same', async () => {
    // Given
    statMock.mockResolvedValueOnce({ data: { size: 1024 } });
    // When
    await abortOnChangeSize(props);
    // Then
    expect(resolve).toBeCalledTimes(0);
    expect(stopUpload).toBeCalledTimes(0);
  });

  it('should abort upload when file size changes', async () => {
    // Given
    statMock.mockResolvedValueOnce({ data: { size: 2048 } });
    // When
    await abortOnChangeSize(props);
    // Then
    expect(resolve).toBeCalledWith({ error: new EnvironmentFileUploaderError('FILE_MODIFIED') });
    expect(stopUpload).toBeCalledTimes(1);
  });
});

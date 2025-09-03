import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { abortOnChangeSize } from './abort-on-change-size';
import * as sleep from '@/apps/main/util';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { EnvironmentFileUploaderError } from './process-error';

describe('abort-on-change-size', () => {
  partialSpyOn(sleep, 'sleep');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const resolve = vi.fn();
  const stopUpload = vi.fn();
  const props = mockProps<typeof abortOnChangeSize>({ size: 1024, resolve, stopUpload });

  it('should abort upload when file size changes', async () => {
    // Given
    statMock.mockResolvedValueOnce({ data: { size: 1024 } });
    statMock.mockResolvedValueOnce({ data: { size: 2048 } });
    // When
    await abortOnChangeSize(props);
    // Then
    expect(resolve).toHaveBeenCalledWith({ error: new EnvironmentFileUploaderError('FILE_MODIFIED') });
    expect(stopUpload).toHaveBeenCalledTimes(1);
    expect(statMock).toHaveBeenCalledTimes(2);
  });
});

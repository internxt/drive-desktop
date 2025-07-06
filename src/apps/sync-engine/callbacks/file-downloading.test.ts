import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { fileDownloading } from './file-downloading';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';

describe('file-downloading', () => {
  const sendMock = partialSpyOn(ipcRendererSyncEngine, 'send');

  const callback = vi.fn();
  const props = mockProps<typeof fileDownloading>({ callback, nameWithExtension: 'file.txt' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error is progress is below 0', async () => {
    // Given
    callback.mockResolvedValue({ finished: false, progress: -1 });
    // When
    const promise = fileDownloading(props);
    // Then
    await expect(promise).rejects.toThrowError();
  });

  it('should throw an error is progress is greater than 1', async () => {
    // Given
    callback.mockResolvedValue({ finished: false, progress: 2 });
    // When
    const promise = fileDownloading(props);
    // Then
    await expect(promise).rejects.toThrowError();
  });

  it('should throw an error is finished and progress is 0', async () => {
    // Given
    callback.mockResolvedValue({ finished: true, progress: 0 });
    // When
    const promise = fileDownloading(props);
    // Then
    await expect(promise).rejects.toThrowError();
  });

  it('should stop iterating if progress is two times the same', async () => {
    // Given
    callback.mockResolvedValueOnce({ finished: false, progress: 0.5 });
    callback.mockResolvedValueOnce({ finished: false, progress: 0.5 });
    // When
    await fileDownloading(props);
    // Then
    expect(sendMock).toBeCalledTimes(1);
  });

  it('should stop iterating when finished', async () => {
    // Given
    callback.mockResolvedValueOnce({ finished: false, progress: 0.5 });
    callback.mockResolvedValueOnce({ finished: true, progress: 1 });
    // When
    await fileDownloading(props);
    // Then
    expect(sendMock).toBeCalledTimes(2);
    expect(sendMock).toBeCalledWith('FILE_DOWNLOADING', {
      nameWithExtension: props.nameWithExtension,
      processInfo: { elapsedTime: 0, progress: 0.5 },
    });

    expect(sendMock).toBeCalledWith('FILE_DOWNLOADING', {
      nameWithExtension: props.nameWithExtension,
      processInfo: { elapsedTime: 0, progress: 1 },
    });
  });
});

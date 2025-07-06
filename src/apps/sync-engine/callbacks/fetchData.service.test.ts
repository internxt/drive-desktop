import { mockDeep } from 'vitest-mock-extended';
import { fetchData } from './fetchData.service';
import { BindingsManager } from '../BindingManager';
import { it } from 'vitest';
import { unlink } from 'fs/promises';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as fileDownloading from './file-downloading';
import { ipcRendererSyncEngine } from '../ipcRendererSyncEngine';

vi.mock('fs/promises');

describe('Fetch Data', () => {
  const fileDownloadingSpy = partialSpyOn(fileDownloading, 'fileDownloading');
  const sendSpy = partialSpyOn(ipcRendererSyncEngine, 'send');

  const absolutePath = 'C:\\Users\\user\\InternxtDrive\\file.txt';
  const self = mockDeep<BindingsManager>();
  const callback = vi.fn();
  let props: Parameters<typeof fetchData>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof fetchData>({ self, callback });
    self.controllers.downloadFile.execute.mockResolvedValue(absolutePath);
  });

  it('should send FILE_DOWNLOADED if everything correct', async () => {
    // When
    await fetchData(props);
    // Then
    expect(unlink).toBeCalledWith(absolutePath);
    expect(callback).not.toBeCalled();
    expect(sendSpy).toBeCalledTimes(1);
    expect(sendSpy).toBeCalledWith('FILE_DOWNLOADED', {
      nameWithExtension: 'file.txt',
      processInfo: { elapsedTime: expect.any(Number) },
    });
  });

  it('should send FILE_DOWNLOAD_ERROR if fileDownloading throws error', async () => {
    // Given
    fileDownloadingSpy.mockRejectedValue(new Error());
    // When
    await fetchData(props);
    // Then
    expect(unlink).toBeCalledWith(absolutePath);
    expect(callback).toBeCalledWith(false, '');
    expect(sendSpy).toBeCalledTimes(1);
    expect(sendSpy).toBeCalledWith('FILE_DOWNLOAD_ERROR', { nameWithExtension: 'file.txt' });
  });

  it('should do nothing if downloadFile throws error', async () => {
    // Given
    self.controllers.downloadFile.execute.mockRejectedValue(new Error());
    // When
    await fetchData(props);
    // Then
    expect(unlink).not.toBeCalled();
    expect(sendSpy).not.toBeCalled();
    expect(callback).toBeCalledWith(false, '');
  });
});

import { Environment } from '@internxt/inxt-js';
import { createReadStream, ReadStream } from 'node:fs';
import { mockDeep } from 'vitest-mock-extended';
import { LocalSync } from '@/backend/features';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as processError from './process-error';
import { uploadFile } from './upload-file';

vi.mock(import('node:fs'));

describe('upload-file', () => {
  const createReadStreamMock = vi.mocked(createReadStream);
  const processErrorMock = partialSpyOn(processError, 'processError');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const environment = mockDeep<Environment>();
  const readable = mockDeep<ReadStream>();

  let abortController: AbortController;
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    statMock.mockResolvedValue({ data: { size: 10 } });
    createReadStreamMock.mockReturnValue(readable);

    abortController = new AbortController();
    props = mockProps<typeof uploadFile>({
      ctx: { environment },
      abortController,
      size: 10,
    });
  });

  it('should upload file', async () => {
    // Given
    environment.upload.mockResolvedValue('contentsId');
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBe('contentsId');
    calls(addItemMock).toHaveLength(0);
    calls(processErrorMock).toHaveLength(0);
  });

  it('should send progress', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.progressCallback(50, 0, 0);
      return Promise.resolve('contentsId');
    });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBe('contentsId');
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 50 });
    calls(processErrorMock).toHaveLength(0);
  });

  it('should process error if upload fails', async () => {
    // Given
    environment.upload.mockRejectedValue(new Error());
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    call(processErrorMock).toMatchObject({ retry: 1, sleepMs: 5000 });
    calls(addItemMock).toHaveLength(0);
  });

  it('should abort upload on change size', async () => {
    // Given
    statMock.mockResolvedValue({ data: { size: 20 } });
    environment.upload.mockImplementation((_, opts) => {
      opts.progressCallback(25, 0, 0);
      return Promise.resolve(undefined as any);
    });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(addItemMock).toHaveLength(0);
    calls(loggerMock.debug).toMatchObject([{ msg: 'Uploading file to the bucket' }, { msg: 'File size changed during upload' }]);
  });

  it('should open and close a stream on every attempt', async () => {
    // Given
    environment.upload.mockResolvedValue('contentsId');
    // When
    await uploadFile(props);
    // Then
    calls(createReadStreamMock).toHaveLength(1);
    calls(readable.close).toHaveLength(1);
  });

  it('should close the stream when the upload fails', async () => {
    // Given
    environment.upload.mockRejectedValue(new Error());
    // When
    await uploadFile(props);
    // Then
    calls(readable.close).toHaveLength(1);
  });

  it('should give the retry a fresh stream and a doubled sleep', async () => {
    // Given
    environment.upload.mockRejectedValue(new Error());
    processErrorMock.mockImplementationOnce(async ({ retryFn }) => await retryFn());
    // When
    await uploadFile({ ...props, retry: 1, sleepMs: 5000 });
    // Then
    calls(createReadStreamMock).toHaveLength(2);
    calls(readable.close).toHaveLength(2);
    calls(processErrorMock).toMatchObject([
      { retry: 1, sleepMs: 5000 },
      { retry: 2, sleepMs: 10000 },
    ]);
  });

  it('should cap the sleep between retries', async () => {
    // Given
    environment.upload.mockRejectedValue(new Error());
    processErrorMock.mockImplementationOnce(async ({ retryFn }) => await retryFn());
    // When
    await uploadFile({ ...props, retry: 1, sleepMs: 40000 });
    // Then
    calls(processErrorMock).toMatchObject([
      { retry: 1, sleepMs: 40000 },
      { retry: 2, sleepMs: 60000 },
    ]);
  });
});

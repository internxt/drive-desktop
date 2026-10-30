import { Environment } from '@internxt/inxt-js';
import { ReadStream } from 'node:fs';
import { mockDeep } from 'vitest-mock-extended';
import { LocalSync } from '@/backend/features';
import { fileSystem } from '@/infra/file-system/file-system.module';
import * as originalFs from '@/infra/file-system/original-fs';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as processError from './process-error';
import { uploadFile } from './upload-file';

describe('upload-file', () => {
  const createReadStreamMock = partialSpyOn(originalFs, 'createReadStream');
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
      attempt: 1,
    });
  });

  it('should upload file', async () => {
    // Given
    environment.upload.mockResolvedValue('contentsId');
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toStrictEqual({ data: 'contentsId' });
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
    expect(res).toStrictEqual({ data: 'contentsId' });
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 50 });
    calls(processErrorMock).toHaveLength(0);
  });

  it('should return the processed error if upload fails', async () => {
    // Given
    const error = new Error();
    environment.upload.mockRejectedValue(error);
    processErrorMock.mockReturnValue(new processError.UploadFileError('RETRYABLE'));
    // When
    const res = await uploadFile(props);
    // Then
    expect(res.error?.code).toBe('RETRYABLE');
    call(processErrorMock).toMatchObject({ path: props.path, size: 10, error });
    calls(addItemMock).toHaveLength(0);
  });

  it('should log the attempt when it is a retry', async () => {
    // Given
    environment.upload.mockResolvedValue('contentsId');
    // When
    await uploadFile({ ...props, attempt: 3 });
    // Then
    call(loggerMock.debug).toMatchObject({ msg: 'Uploading file to the bucket', retry: 3 });
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
    expect(res).toStrictEqual({ data: undefined });
    calls(addItemMock).toHaveLength(0);
    calls(loggerMock.debug).toMatchObject([{ msg: 'Uploading file to the bucket' }, { msg: 'File size changed during upload' }]);
  });

  it('should open and close a stream', async () => {
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
});

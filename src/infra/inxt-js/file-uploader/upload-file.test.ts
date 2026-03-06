import { mockDeep } from 'vitest-mock-extended';
import { Environment } from '@internxt/inxt-js';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as processError from './process-error';
import { ReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { LocalSync } from '@/backend/features';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('upload-file', () => {
  const processErrorMock = partialSpyOn(processError, 'processError');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const statMock = partialSpyOn(fileSystem, 'stat');

  const environment = mockDeep<Environment>();
  const readable = mockDeep<ReadStream>();

  let abortController: AbortController;
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    statMock.mockResolvedValue({ data: { size: 10 } });

    abortController = new AbortController();
    props = mockProps<typeof uploadFile>({
      ctx: { environment },
      abortController,
      readable,
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
    call(processErrorMock).toMatchObject({ sleepMs: 5000 });
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
});

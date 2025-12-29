import { mockDeep } from 'vitest-mock-extended';
import { Environment } from '@internxt/inxt-js';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import * as processError from './process-error';
import { ReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { LocalSync } from '@/backend/features';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { sleep } from '@/apps/main/util';

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
      ctx: { abortController },
      fn: environment.upload,
      readable,
      size: 10,
    });
  });

  it('should upload file', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.finishedCallback(null, 'contentsId');
      return new ActionState(ActionTypes.Upload);
    });
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
      opts.finishedCallback(null, 'contentsId');
      return new ActionState(ActionTypes.Upload);
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
    environment.upload.mockImplementation((_, opts) => {
      opts.finishedCallback(new Error(), null);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(addItemMock).toHaveLength(0);
    calls(processErrorMock).toHaveLength(1);
  });

  it('should destroy read stream if signal aborted', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.progressCallback(50, 0, 0);
      setTimeout(() => abortController.abort(), 25);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    const res = await uploadFile(props);
    await sleep(50);
    // Then
    expect(res).toBeUndefined();
    call(addItemMock).toMatchObject({ action: 'UPLOADING', progress: 50 });
    calls(readable.destroy).toHaveLength(1);
  });

  it('should stop abort upload on change size', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.progressCallback(25, 0, 0);
      opts.progressCallback(50, 0, 0);
      statMock.mockResolvedValue({ data: { size: 20 } });
      opts.progressCallback(75, 0, 0);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    const res = await uploadFile(props);
    // Then
    expect(res).toBeUndefined();
    calls(readable.destroy).toHaveLength(1);
    calls(addItemMock).toMatchObject([
      { action: 'UPLOADING', progress: 25 },
      { action: 'UPLOADING', progress: 50 },
    ]);
  });
});

import { mockDeep } from 'vitest-mock-extended';
import { Environment } from '@internxt/inxt-js';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import * as processError from './process-error';
import * as abortOnChangeSize from './abort-on-change-size';
import { ReadStream } from 'node:fs';
import { uploadFile } from './upload-file';
import { LocalSync } from '@/backend/features';

describe('upload-file', () => {
  const abortOnChangeSizeMock = partialSpyOn(abortOnChangeSize, 'abortOnChangeSize');
  const processErrorMock = partialSpyOn(processError, 'processError');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');

  const environment = mockDeep<Environment>();
  const readable = mockDeep<ReadStream>();
  let abortController: AbortController;
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    vi.useFakeTimers();

    abortController = new AbortController();
    props = mockProps<typeof uploadFile>({
      fn: environment.upload,
      readable,
      abortSignal: abortController.signal,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should upload file', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.finishedCallback(null, 'contentsId');
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await uploadFile(props);
    // Then
    call(addItemMock).toMatchObject({ action: 'UPLOADED' });
    expect(processErrorMock).toBeCalledTimes(0);
  });

  it('should send progress', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.progressCallback(50, 0, 0);
      opts.finishedCallback(null, 'contentsId');
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await uploadFile(props);
    // Then
    calls(addItemMock).toMatchObject([{ action: 'UPLOADING', progress: 50 }, { action: 'UPLOADED' }]);
    expect(processErrorMock).toBeCalledTimes(0);
  });

  it('should process error if upload fails', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      opts.finishedCallback(new Error(), null);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await uploadFile(props);
    // Then
    calls(addItemMock).toHaveLength(0);
    expect(processErrorMock).toBeCalledTimes(1);
  });

  it('should destroy read stream if signal aborted', () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      setTimeout(() => {
        abortController.abort();
        opts.finishedCallback(null, 'contentsId');
      }, 50);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    void uploadFile(props);
    vi.advanceTimersByTime(50);
    // Then
    expect(readable.destroy).toBeCalledTimes(1);
  });

  it('should call abort on change size after 5s', () => {
    // Given
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    environment.upload.mockImplementation((_, opts) => {
      setTimeout(() => {
        abortController.abort();
        opts.finishedCallback(null, 'contentsId');
      }, 11000);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    void uploadFile(props);
    vi.advanceTimersByTime(11000);
    // Then
    expect(abortOnChangeSizeMock).toBeCalledTimes(2);
    expect(clearIntervalSpy).toBeCalledTimes(1);
  });
});

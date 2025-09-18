import { mockDeep } from 'vitest-mock-extended';
import { Environment } from '@internxt/inxt-js';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import { FileUploaderCallbacks } from './file-uploader';
import * as processError from './process-error';
import * as abortOnChangeSize from './abort-on-change-size';
import { ReadStream } from 'fs';
import { uploadFile } from './upload-file';

describe('upload-file', () => {
  const abortOnChangeSizeMock = partialSpyOn(abortOnChangeSize, 'abortOnChangeSize');
  const processErrorMock = partialSpyOn(processError, 'processError');

  const environment = mockDeep<Environment>();
  const callbacks = mockDeep<FileUploaderCallbacks>();
  const readable = mockDeep<ReadStream>();
  let abortController: AbortController;
  let props: Parameters<typeof uploadFile>[0];

  beforeEach(() => {
    vi.useRealTimers();

    abortController = new AbortController();
    props = mockProps<typeof uploadFile>({
      fn: environment.upload,
      readable,
      callbacks,
      abortSignal: abortController.signal,
    });
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
    expect(callbacks.onFinish).toBeCalledTimes(1);
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
    expect(callbacks.onProgress).toBeCalledWith({ progress: 50 });
    expect(callbacks.onFinish).toBeCalledTimes(1);
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
    expect(callbacks.onFinish).toBeCalledTimes(0);
    expect(processErrorMock).toBeCalledTimes(1);
  });

  it('should destroy read stream if signal aborted', async () => {
    // Given
    environment.upload.mockImplementation((_, opts) => {
      setTimeout(() => {
        abortController.abort();
        opts.finishedCallback(null, 'contentsId');
      }, 50);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await uploadFile(props);
    // Then
    expect(readable.destroy).toBeCalledTimes(1);
  });

  it('should call abort on change size after 5s', () => {
    // Given
    vi.useFakeTimers();
    // When
    void uploadFile(props);
    vi.advanceTimersByTime(10000);
    // Then
    expect(abortOnChangeSizeMock).toBeCalledTimes(2);
  });
});

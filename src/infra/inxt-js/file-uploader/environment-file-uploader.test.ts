import { mockDeep } from 'vitest-mock-extended';
import { EnvironmentFileUploader } from './environment-file-uploader';
import { Environment } from '@internxt/inxt-js';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ReadStream } from 'fs';
import { ActionState, ActionTypes } from '@internxt/inxt-js/build/api';
import { FileUploaderCallbacks } from './file-uploader';
import * as processError from './process-error';
import * as abortOnChangeSize from './abort-on-change-size';

vi.mock(import('fs'));

describe('environment-file-uploader', () => {
  partialSpyOn(abortOnChangeSize, 'abortOnChangeSize');
  const processErrorMock = partialSpyOn(processError, 'processError');
  const environment = mockDeep<Environment>();
  const bucket = 'bucket';
  const service = new EnvironmentFileUploader(environment, bucket);

  const callbacks = mockDeep<FileUploaderCallbacks>();
  let abortController: AbortController;
  let props: Parameters<typeof service.upload>[0];

  beforeEach(() => {
    abortController = new AbortController();
    props = mockProps<typeof service.upload>({ size: 100, callbacks, abortSignal: abortController.signal });
  });

  it('should use upload if file is small than 100MB', async () => {
    // Given
    props.size = 100 * 1024 * 1024 - 1;
    environment.upload.mockImplementation((_, opts) => {
      opts.finishedCallback(null, 'contentsId');
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await service.upload(props);
    // Then
    expect(callbacks.onProgress).toBeCalledWith({ progress: 0 });
    expect(callbacks.onFinish).toBeCalledTimes(1);
    expect(processErrorMock).toBeCalledTimes(0);
  });

  it('should use multipart upload if file is bigger than 100MB', async () => {
    // Given
    props.size = 100 * 1024 * 1024 + 1;
    environment.uploadMultipartFile.mockImplementation((_, opts) => {
      opts.finishedCallback(null, 'contentsId');
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await service.upload(props);
    // Then
    expect(callbacks.onProgress).toBeCalledWith({ progress: 0 });
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
    await service.upload(props);
    // Then
    expect(callbacks.onProgress).toBeCalledWith({ progress: 0 });
    expect(callbacks.onProgress).toBeCalledWith({ progress: 50 });
    expect(callbacks.onFinish).toBeCalledTimes(1);
    expect(processErrorMock).toBeCalledTimes(0);
  });

  it('should process error if upload fails', async () => {
    // Given
    props.size = 100 * 1024 * 1024 - 1;
    environment.upload.mockImplementation((_, opts) => {
      opts.finishedCallback(new Error(), null);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await service.upload(props);
    // Then
    expect(callbacks.onProgress).toBeCalledWith({ progress: 0 });
    expect(callbacks.onFinish).toBeCalledTimes(0);
    expect(processErrorMock).toBeCalledTimes(1);
  });

  it('should destroy read stream if signal aborted', async () => {
    // Given
    props.readable = new ReadStream();
    environment.upload.mockImplementation((_, opts) => {
      setTimeout(() => {
        abortController.abort();
        opts.finishedCallback(null, 'contentsId');
      }, 50);
      return new ActionState(ActionTypes.Upload);
    });
    // When
    await service.upload(props);
    // Then
    expect(props.readable.destroy).toBeCalledTimes(1);
  });
});

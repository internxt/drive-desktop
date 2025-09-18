import { mockDeep } from 'vitest-mock-extended';
import { EnvironmentFileUploader } from './environment-file-uploader';
import { Environment } from '@internxt/inxt-js';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { FileUploaderCallbacks } from './file-uploader';
import * as uploadFile from './upload-file';
import { createReadStream, ReadStream } from 'fs';

vi.mock(import('fs'));

describe('environment-file-uploader', () => {
  const createReadStreamMock = vi.mocked(createReadStream);
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');

  const environment = mockDeep<Environment>();
  const bucket = 'bucket';
  const service = new EnvironmentFileUploader(environment, bucket);

  const callbacks = mockDeep<FileUploaderCallbacks>();
  const readable = mockDeep<ReadStream>();

  let props: Parameters<typeof service.upload>[0];

  beforeEach(() => {
    createReadStreamMock.mockReturnValue(readable);

    props = mockProps<typeof service.upload>({ size: 100, callbacks });
  });

  it('should use upload if file is small than 100MB', () => {
    // Given
    props.size = 100 * 1024 * 1024 - 1;
    // When
    void service.upload(props);
    // Then
    expect(callbacks.onProgress).toBeCalledWith({ progress: 0 });
    expect(uploadFileMock)
      .toBeCalledTimes(1)
      .toBeCalledWith(expect.objectContaining({ fn: environment.upload }));
  });

  it('should use multipart upload if file is bigger than 100MB', () => {
    // Given
    props.size = 100 * 1024 * 1024 + 1;
    // When
    void service.upload(props);
    // Then
    expect(callbacks.onProgress).toBeCalledWith({ progress: 0 });
    expect(uploadFileMock)
      .toBeCalledTimes(1)
      .toBeCalledWith(expect.objectContaining({ fn: environment.uploadMultipartFile }));
  });
});

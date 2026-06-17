import { Environment } from '@internxt/inxt-js';
import { uploadThumbnailToBucket } from './upload-thumbnail-to-bucket';
import { UPLOAD_TIMEOUT_MS } from './thumbnail.constants';
import { partialSpyOn } from '../../../../tests/vitest/utils.helper';

type UploadMock = (
  bucket: string,
  options: { source: NodeJS.ReadableStream; fileSize: number; abortSignal?: AbortSignal },
) => Promise<string>;

function environmentMock(upload: UploadMock): Environment {
  return { upload } as unknown as Environment;
}

describe('upload-thumbnail-to-bucket', () => {
  const bucket = 'test-bucket';
  const buffer = Buffer.from('image-data');
  const setTimeoutMock = partialSpyOn(global, 'setTimeout');
  const clearTimeoutMock = partialSpyOn(global, 'clearTimeout');

  it('should return data with contentsId on successful upload', async () => {
    const contentsId = 'contents-id-123';
    const environment = environmentMock(async () => contentsId);

    const { data, error } = await uploadThumbnailToBucket(environment, bucket, buffer);

    expect(error).toBeUndefined();
    expect(data).toBe(contentsId);
    expect(setTimeoutMock).toBeCalled();
    expect(clearTimeoutMock).toBeCalled();
  });

  it('should return error when upload rejects', async () => {
    const uploadError = new Error('bucket error');
    const environment = environmentMock(async () => Promise.reject(uploadError));

    const { error } = await uploadThumbnailToBucket(environment, bucket, buffer);

    expect(error).toBe(uploadError);
    expect(setTimeoutMock).toHaveBeenCalled();
    expect(clearTimeoutMock).toHaveBeenCalled();
  });

  it('should return error when upload resolves with empty contentsId', async () => {
    const environment = environmentMock(async () => '');

    const { error } = await uploadThumbnailToBucket(environment, bucket, buffer);

    expect(error).toBeInstanceOf(Error);
    expect(setTimeoutMock).toHaveBeenCalled();
    expect(clearTimeoutMock).toHaveBeenCalled();
  });

  it('should return error when upload times out', async () => {
    vi.useFakeTimers();

    const environment = environmentMock(
      (_bucket, { abortSignal }) =>
        new Promise((_resolve, reject) => {
          abortSignal?.addEventListener(
            'abort',
            () => {
              reject(new Error('aborted'));
            },
            { once: true },
          );
        }),
    );

    const resultPromise = uploadThumbnailToBucket(environment, bucket, buffer);
    vi.advanceTimersByTime(UPLOAD_TIMEOUT_MS);

    const { error } = await resultPromise;

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe('Thumbnail bucket upload timed out');
    expect(clearTimeoutMock).toHaveBeenCalled();

    vi.useRealTimers();
  });
});

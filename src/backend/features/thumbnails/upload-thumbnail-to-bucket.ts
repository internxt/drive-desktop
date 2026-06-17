import { Environment } from '@internxt/inxt-js';
import { Readable } from 'node:stream';
import { Result } from '../../../context/shared/domain/Result';
import { UPLOAD_TIMEOUT_MS } from './thumbnail.constants';

export async function uploadThumbnailToBucket(
  environment: Environment,
  bucket: string,
  buffer: Buffer,
): Promise<Result<string, Error>> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, UPLOAD_TIMEOUT_MS);

  try {
    const contentsId = await environment.upload(bucket, {
      source: Readable.from(buffer),
      fileSize: buffer.length,
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    if (!contentsId) {
      return { error: new Error('Upload finished but no contentsId returned') };
    }

    return { data: contentsId };
  } catch (error: unknown) {
    if (abortController.signal.aborted) {
      return { error: new Error('Thumbnail bucket upload timed out') };
    }

    const uploadError = error instanceof Error ? error : new Error('Thumbnail bucket upload failed');
    return { error: uploadError };
  } finally {
    clearTimeout(timeoutId);
  }
}

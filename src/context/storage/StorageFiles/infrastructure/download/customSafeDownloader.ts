import { Environment } from '@internxt/inxt-js';
import { PassThrough } from 'stream';
import { downloadFileV2 } from '@internxt/inxt-js/build/lib/core/download/downloadV2';

/**
 * Wraps the @internxt/inxt-js `downloadFileV2` function to ensure that
 * all errors are safely emitted through a controlled stream interface,
 * avoiding `Uncaught (in promise)` issues when download promises fail internally.
 *
 * This wrapper also gives you a consistent, predictable stream to interact with,
 * regardless of how the SDK behaves under the hood.
 *
 * @param env - An instance of the Internxt Environment containing configuration and credentials
 * @returns A safe download function that accepts a bucketId and fileId,
 *          and returns a PassThrough stream with all errors and data piped properly.
 *
 * @example
 * const safeDownload = customSafeDownloader(env);
 * const stream = safeDownload(bucketId, fileId);
 *
 * stream.on('data', ...);
 * stream.on('error', ...);
 */
export function customSafeDownloader(env: Environment) {
  return (bucketId: string, fileId: string): PassThrough => {
    const { encryptionKey, bridgeUrl, bridgeUser, bridgePass } = env.config;
    if (!encryptionKey || !bridgeUrl) {
      throw new Error('Missing required environment configuration');
    }

    const passThroughStream = new PassThrough(); // Custom stream we control
    const abortController = new AbortController();
    try {
      const [downloadPromise, stream] = downloadFileV2(
        fileId,
        bucketId,
        encryptionKey,
        bridgeUrl,
        {
          user: bridgeUser,
          pass: bridgePass,
        },
        () => {
          /* progressCallback (no-op) */
        },
        () => {
          /* onV2Confirmed (no-op) */
        },
        abortController
      );

      // Pipe SDK's stream into our custom passThroughStream
      stream.pipe(passThroughStream);

      // Capture internal promise errors and re-emit through passThroughStream
      downloadPromise.catch((err) => {
        passThroughStream.emit('error', err);
      });
    } catch (err) {
      // Handle synchronous setup errors
      setTimeout(() => passThroughStream.emit('error', err as Error));
    }
    return passThroughStream;
  };
}

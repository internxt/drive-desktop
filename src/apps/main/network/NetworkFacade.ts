import { Environment } from '@internxt/inxt-js';
import { Network as NetworkModule } from '@internxt/sdk';
import { BinaryData } from '@internxt/sdk/dist/network/types';
import { createDecipheriv, randomBytes } from 'crypto';
import { validateMnemonic } from 'bip39';
import { downloadFile } from '@internxt/sdk/dist/network/download';
import { buildProgressStream, DownloadProgressCallback, getDecryptedStream } from './download';
import fetch from 'electron-fetch';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';

interface DownloadOptions {
  key?: Buffer;
  token?: string;
  abortController?: AbortController;
  downloadingCallback?: DownloadProgressCallback;
}

export function convertToReadableStream(readStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      readStream.on('data', (chunk) => {
        controller.enqueue(new Uint8Array(chunk));
      });

      readStream.on('end', () => {
        controller.close();
      });

      readStream.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      readStream.destroy();
    },
  });
}

/**
 * The entry point for interacting with the network
 */
export class NetworkFacade {
  private readonly cryptoLib: NetworkModule.Crypto;

  constructor(private readonly network: NetworkModule.Network) {
    this.cryptoLib = {
      algorithm: NetworkModule.ALGORITHMS.AES256CTR,
      validateMnemonic: (mnemonic) => {
        return validateMnemonic(mnemonic);
      },
      generateFileKey: (mnemonic, bucketId, index) => {
        return Environment.utils.generateFileKey(mnemonic, bucketId, index as Buffer);
      },
      randomBytes,
    };
  }

  async download(
    bucketId: string,
    fileId: string,
    mnemonic: string,
    options?: DownloadOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const encryptedContentStreams: ReadableStream<Uint8Array>[] = [];
    let fileStream: ReadableStream<Uint8Array>;

    // TODO: Check hash when downloaded
    await downloadFile(
      fileId,
      bucketId,
      mnemonic,
      this.network,
      this.cryptoLib,
      Buffer.from,
      async (downloadables) => {
        for (const downloadable of downloadables) {
          if (options?.abortController?.signal.aborted) {
            throw new Error('Download aborted');
          }

          const encryptedContentStream = await fetch(downloadable.url, {
            signal: options?.abortController?.signal,
          });
          if (!encryptedContentStream.body) {
            throw new Error('No content received');
          }
          encryptedContentStreams.push(convertToReadableStream(encryptedContentStream.body as Readable));
        }
      },
      async (_, key, iv, fileSize) => {
        const toUint8Array = (data: BinaryData | Buffer): Uint8Array =>
          Uint8Array.from(Buffer.isBuffer(data) ? data : Buffer.from(data.toString('hex'), 'hex'));
        const cipherKey = options?.key ?? key;
        const decryptedStream = getDecryptedStream(
          encryptedContentStreams,
          createDecipheriv('aes-256-ctr', toUint8Array(cipherKey), toUint8Array(iv)),
        );

        fileStream = buildProgressStream(decryptedStream, (readBytes) => {
          options && options.downloadingCallback && options.downloadingCallback(fileSize, readBytes);
        });
      },
      (options?.token && { token: options.token }) || undefined,
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return fileStream!;
  }
}

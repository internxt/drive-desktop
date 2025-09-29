import { Environment } from '@internxt/inxt-js/build';
import { Network as NetworkModule } from '@internxt/sdk';
import { createDecipheriv, randomBytes } from 'node:crypto';
import { validateMnemonic } from 'bip39';
import { downloadFile } from '@internxt/sdk/dist/network/download';
import { buildProgressStream, getDecryptedStream } from './download';
import fetch from 'electron-fetch';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import { DownloadProgressCallback } from '@internxt/inxt-js/build/lib/core';

interface DownloadOptions {
  abortController?: AbortController;
  notifyProgress: DownloadProgressCallback;
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

  async download(bucketId: string, fileId: string, mnemonic: string, options: DownloadOptions): Promise<ReadableStream<Uint8Array>> {
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
          if (options.abortController?.signal.aborted) {
            throw new Error('Download aborted');
          }

          const encryptedContentStream = await fetch(downloadable.url, {
            signal: options.abortController?.signal,
          }).then((res) => {
            if (!res.body) {
              throw new Error('No content received');
            }

            return convertToReadableStream(res.body as Readable);
          });

          encryptedContentStreams.push(encryptedContentStream);
        }
      },
      async (_, key, iv, fileSize) => {
        const decryptedStream = getDecryptedStream(encryptedContentStreams, createDecipheriv('aes-256-ctr', key as Buffer, iv as Buffer));

        fileStream = buildProgressStream(decryptedStream, (readBytes) => {
          // options.notifyProgress(readBytes / fileSize, readBytes, fileSize);
        });
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return fileStream!;
  }
}

export function convertToReadableStream(readStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      readStream.on('data', (chunk) => {
        // Convertir el chunk a Uint8Array y pasarlo al controller
        controller.enqueue(new Uint8Array(chunk));
      });

      readStream.on('end', () => {
        // Señalar que la transmisión ha finalizado
        controller.close();
      });

      readStream.on('error', (err) => {
        // Señalar un error al controller
        controller.error(err);
      });
    },
    cancel() {
      // Abortar la lectura del ReadStream de fs
      readStream.destroy();
    },
  });
}

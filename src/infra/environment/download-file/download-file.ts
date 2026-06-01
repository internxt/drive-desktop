import { DecryptFileFunction, DownloadFileFunction } from '@internxt/sdk/dist/network';
import { downloadFile as sdkDownloadFile } from '@internxt/sdk/dist/network/download';
import axios from 'axios';
import { buildCryptoLib } from './build-crypto-lib';
import { DownloadFileProps } from './types';
import { decryptAtOffset } from './decrypt-at-offset';
import { type Result } from '../../../context/shared/domain/Result';

export async function downloadFileRange({
  signal,
  fileId,
  bucketId,
  mnemonic,
  network,
  range,
}: DownloadFileProps): Promise<Result<Buffer, Error>> {
  let encryptedBytes: Buffer | undefined;
  let decryptedBuffer: Buffer | undefined;
  let operationError: Error | undefined;

  const downloadFileCb: DownloadFileFunction = async (downloadables) => {
    if (range && downloadables.length > 1) {
      operationError = new Error('Multi-Part Download with Range-Requests is not implemented');
      return;
    }
    for (const downloadable of downloadables) {
      if (signal.aborted) {
        return;
      }
      // eslint-disable-next-line no-await-in-loop
      encryptedBytes = await fetchEncryptedRange(downloadable.url, range.position, range.length, signal);
    }
  };

  const decryptFileCb: DecryptFileFunction = async (_, key, iv) => {
    if (signal.aborted) {
      return;
    }
    if (!encryptedBytes) {
      operationError = new Error('No encrypted bytes to decrypt');
      return;
    }
    decryptedBuffer = decryptAtOffset(
      encryptedBytes,
      Buffer.from(key.toString('hex'), 'hex'),
      Buffer.from(iv.toString('hex'), 'hex'),
      range.position,
    );
  };

  try {
    await sdkDownloadFile(
      fileId,
      bucketId,
      mnemonic,
      network,
      buildCryptoLib(),
      Buffer.from,
      downloadFileCb,
      decryptFileCb,
    );
  } catch (error) {
    if (signal.aborted) return abortedDownloadResult();
    return { error: error instanceof Error ? error : new Error('Unknown error occurred') };
  }

  if (signal.aborted) return abortedDownloadResult();
  if (operationError) return { error: operationError };
  if (!decryptedBuffer) return { error: new Error('Decryption did not produce a buffer') };
  return { data: decryptedBuffer };
}

function abortedDownloadResult(): Result<Buffer, Error> {
  return { data: Buffer.alloc(0) };
}

async function fetchEncryptedRange(
  url: string,
  position: number,
  length: number,
  signal: AbortSignal,
): Promise<Buffer> {
  const response = await axios.get<NodeJS.ReadableStream>(url, {
    responseType: 'stream',
    signal,
    headers: {
      range: `bytes=${position}-${position + length - 1}`,
    },
  });

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    response.data.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    response.data.on('end', () => resolve(Buffer.concat(chunks)));
    response.data.on('error', reject);
  });
}

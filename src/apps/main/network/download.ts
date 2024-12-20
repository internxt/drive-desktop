/* eslint-disable no-await-in-loop */
import { FileVersionOneError } from '@internxt/sdk/dist/network/download';
import { FlatFolderZip } from './zip.service';
import { items } from '@internxt/lib';
import fs, { PathLike } from 'fs';
import {
  FileInfo,
  getFileInfoWithAuth,
  getFileInfoWithToken,
  getMirrors,
  Mirror,
  NetworkCredentials,
} from './requests';
import { GenerateFileKey } from '@internxt/inxt-js/build/lib/utils/crypto';
import { createDecipheriv, Decipher } from 'crypto';
import downloadFileV2 from './downloadv2';
import { fetchArrayFolderTree } from '../device/service';
import { ReadableStream, WritableStream } from 'node:stream/web';
import { Readable } from 'node:stream';
import fetch from 'electron-fetch';
import { FolderTree } from '@internxt/sdk/dist/drive/storage/types';
import { convertToReadableStream } from './NetworkFacade';
import Logger from 'electron-log';
import path from 'path';

async function writeReadableStreamToFile(
  readableStream: ReadableStream<Uint8Array>,
  filePath: string
): Promise<void> {
  const writer = fs.createWriteStream(filePath);

  const reader = readableStream.getReader();

  return new Promise((resolve, reject) => {
    function processChunk({
      done,
      value,
    }: ReadableStreamReadResult<Uint8Array>) {
      if (done) {
        writer.end(); // Finalizar escritura del archivo
        resolve();
        return;
      }

      writer.write(Buffer.from(value), (err) => {
        if (err) {
          reject(err);
        } else {
          reader.read().then(processChunk).catch(reject);
        }
      });
    }

    reader.read().then(processChunk).catch(reject);

    writer.on('error', (err) => {
      reject(err);
    });
  });
}

export async function downloadFolder(
  deviceName: string,
  networkApiUrl: string,
  foldersUuid: string[],
  targetPath: PathLike,
  environment: {
    bridgeUser: string;
    bridgePass: string;
    encryptionKey: string;
  },
  opts: {
    abortController?: AbortController;
    updateProgress?: (progress: number) => void;
  }
) {
  Logger.info('Downloading folder to directory');

  const { abortController, updateProgress } = opts;
  const { bridgeUser, bridgePass, encryptionKey } = environment;

  // Obtener información del árbol de carpetas y archivos
  updateProgress && updateProgress(1);

  const { tree, folderDecryptedNames, fileDecryptedNames, size, totalItems } =
    await fetchArrayFolderTree(foldersUuid);

  tree.plainName = deviceName;
  folderDecryptedNames[tree.id] = deviceName;

  const pendingFolders: { path: string; data: FolderTree }[] = [
    { path: '', data: tree },
  ];

  // let downloadedBytes = 0;
  let downloadedItems = 0;

  while (pendingFolders.length > 0 && !abortController?.signal.aborted) {
    const currentFolder = pendingFolders.shift() as {
      path: string;
      data: FolderTree;
    };

    const folderPath =
      currentFolder.path +
      (currentFolder.path === '' ? '' : '/') +
      folderDecryptedNames[currentFolder.data.id];

    Logger.info('Creating folder:', folderPath);

    // Crear el directorio si no existe
    await fs.promises.mkdir(targetPath + '/' + folderPath, { recursive: true });

    const { files, children: folders } = currentFolder.data;

    for (const file of files) {
      if (abortController?.signal.aborted) {
        throw new Error('Download cancelled');
      }

      const displayFilename = items.getItemDisplayName({
        name: fileDecryptedNames[file.id],
        type: file.type,
      });

      const filePath = path.join(folderPath, displayFilename);

      Logger.info('Downloading file:', filePath);

      const fileStream = await downloadFile({
        networkApiUrl,
        bucketId: file.bucket,
        fileId: file.fileId,
        creds: {
          pass: bridgePass,
          user: bridgeUser,
        },
        mnemonic: encryptionKey,
        options: {
          abortController: opts.abortController,
        },
      });

      // Leer el stream y escribirlo en el archivo
      await writeReadableStreamToFile(fileStream, targetPath + '/' + filePath);
      Logger.info(`total files: ${totalItems}, downloaded: ${downloadedItems}`);
      downloadedItems += 1;
      updateProgress && updateProgress((downloadedItems / totalItems) * 100);
    }

    pendingFolders.push(
      ...folders.map((tree) => ({ path: folderPath, data: tree }))
    );
  }

  if (abortController?.signal.aborted) {
    throw new Error('Download cancelled');
  }

  Logger.info('Download complete:', targetPath);
  updateProgress && updateProgress(100);
}

export type DownloadProgressCallback = (
  totalBytes: number,
  downloadedBytes: number
) => void;
export interface IDownloadParams {
  networkApiUrl: string;
  bucketId: string;
  fileId: string;
  creds?: NetworkCredentials;
  mnemonic?: string;
  encryptionKey?: Buffer;
  token?: string;
  options?: {
    notifyProgress?: DownloadProgressCallback;
    abortController?: AbortController;
  };
}

interface MetadataRequiredForDownload {
  mirrors: Mirror[];
  fileMeta: FileInfo;
}

async function getRequiredFileMetadataWithToken(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  token: string
): Promise<MetadataRequiredForDownload> {
  const fileMeta: FileInfo = await getFileInfoWithToken(
    networkApiUrl,
    bucketId,
    fileId,
    token
  );
  const mirrors: Mirror[] = await getMirrors(
    networkApiUrl,
    bucketId,
    fileId,
    null,
    token
  );

  return { fileMeta, mirrors };
}

async function getRequiredFileMetadataWithAuth(
  networkApiUrl: string,
  bucketId: string,
  fileId: string,
  creds: NetworkCredentials
): Promise<MetadataRequiredForDownload> {
  const fileMeta: FileInfo = await getFileInfoWithAuth(
    networkApiUrl,
    bucketId,
    fileId,
    creds
  );
  const mirrors: Mirror[] = await getMirrors(
    networkApiUrl,
    bucketId,
    fileId,
    creds
  );

  return { fileMeta, mirrors };
}

async function downloadFile(
  params: IDownloadParams
): Promise<ReadableStream<Uint8Array>> {
  const downloadFileV2Promise = downloadFileV2(params as any);

  return downloadFileV2Promise.catch((err: Error) => {
    if (err instanceof FileVersionOneError) {
      return _downloadFile(params);
    }

    throw err;
  });
}

async function _downloadFile(
  params: IDownloadParams
): Promise<ReadableStream<Uint8Array>> {
  const { networkApiUrl, bucketId, fileId, token, creds } = params;

  let metadata: MetadataRequiredForDownload;

  if (creds) {
    metadata = await getRequiredFileMetadataWithAuth(
      networkApiUrl,
      bucketId,
      fileId,
      creds
    );
  } else if (token) {
    metadata = await getRequiredFileMetadataWithToken(
      networkApiUrl,
      bucketId,
      fileId,
      token
    );
  } else {
    throw new Error('Download error 1');
  }

  const { mirrors, fileMeta } = metadata;
  const downloadUrls: string[] = mirrors.map((m) => m.url);

  const index = Buffer.from(fileMeta.index, 'hex');
  const iv = index.slice(0, 16);
  let key: Buffer;

  if (params.encryptionKey) {
    key = params.encryptionKey;
  } else if (params.mnemonic) {
    key = await GenerateFileKey(params.mnemonic, bucketId, index);
  } else {
    throw new Error('Download error code 1');
  }

  const downloadStream = await getFileDownloadStream(
    downloadUrls,
    createDecipheriv('aes-256-ctr', key, iv),
    params.options?.abortController
  );

  return buildProgressStream(downloadStream, (readBytes) => {
    params.options?.notifyProgress(metadata.fileMeta.size, readBytes);
  });
}

async function getFileDownloadStream(
  downloadUrls: string[],
  decipher: Decipher,
  abortController?: AbortController
): Promise<ReadableStream> {
  const encryptedContentParts: ReadableStream<Uint8Array>[] = [];

  for (const downloadUrl of downloadUrls) {
    const encryptedStream = await fetch(downloadUrl, {
      signal: abortController?.signal,
    }).then((res) => {
      if (!res.body) {
        throw new Error('No content received');
      }

      return convertToReadableStream(res.body as Readable);
    });

    encryptedContentParts.push(encryptedStream);
  }

  return getDecryptedStream(encryptedContentParts, decipher);
}

export function buildProgressStream(
  source: ReadableStream<Uint8Array>,
  onRead: (readBytes: number) => void
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let readBytes = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const status = await reader.read();

      if (status.done) {
        controller.close();
      } else {
        readBytes += (status.value as Uint8Array).length;

        onRead(readBytes);
        controller.enqueue(status.value);
      }
    },
    cancel() {
      return reader.cancel();
    },
  });
}

function joinReadableBinaryStreams(
  streams: ReadableStream<Uint8Array>[]
): ReadableStream {
  const streamsCopy = streams.map((s) => s);
  let keepReading = true;

  const flush = () => streamsCopy.forEach((s) => s.cancel());

  const stream = new ReadableStream({
    async pull(controller) {
      if (!keepReading) return flush();

      const downStream = streamsCopy.shift();

      if (!downStream) {
        return controller.close();
      }

      const reader = downStream.getReader();
      let done = false;

      while (!done && keepReading) {
        const status = await reader.read();

        if (!status.done) {
          controller.enqueue(status.value);
        }

        done = status.done;
      }

      reader.releaseLock();
    },
    cancel() {
      keepReading = false;
    },
  });

  return stream;
}

export function getDecryptedStream(
  encryptedContentSlices: ReadableStream<Uint8Array>[],
  decipher: Decipher
): ReadableStream<Uint8Array> {
  const encryptedStream = joinReadableBinaryStreams(encryptedContentSlices);

  let keepReading = true;

  const decryptedStream = new ReadableStream({
    async pull(controller) {
      if (!keepReading) return;

      const reader = encryptedStream.getReader();
      const status = await reader.read();

      if (status.done) {
        controller.close();
      } else {
        controller.enqueue(decipher.update(status.value));
      }

      reader.releaseLock();
    },
    cancel() {
      keepReading = false;
    },
  });

  return decryptedStream;
}

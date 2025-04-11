import { Network } from '@internxt/sdk/dist/network';
import { sha256 } from './requests';
import { NetworkFacade } from './NetworkFacade';
import { ReadableStream } from 'node:stream/web';
import { appInfo } from '../app-info/app-info';
import { logger } from '@/apps/shared/logger/logger';

type DownloadProgressCallback = (totalBytes: number, downloadedBytes: number) => void;
type FileStream = ReadableStream<Uint8Array>;
type DownloadFileResponse = Promise<FileStream>;
type DownloadFileOptions = { notifyProgress: DownloadProgressCallback; abortController?: AbortController };
interface NetworkCredentials {
  user: string;
  pass: string;
}

interface DownloadFileParams {
  bucketId: string;
  fileId: string;
  options?: DownloadFileOptions;
}

export interface DownloadOwnFileParams extends DownloadFileParams {
  creds: NetworkCredentials;
  mnemonic: string;
  token?: never;
  encryptionKey?: never;
}

interface DownloadSharedFileParams extends DownloadFileParams {
  creds?: never;
  mnemonic?: never;
  token: string;
  encryptionKey: string;
}

type DownloadSharedFileFunction = (params: DownloadSharedFileParams) => DownloadFileResponse;
type DownloadOwnFileFunction = (params: DownloadOwnFileParams) => DownloadFileResponse;
type DownloadFileFunction = (params: DownloadSharedFileParams | DownloadOwnFileParams) => DownloadFileResponse;

const downloadSharedFile: DownloadSharedFileFunction = (params) => {
  const { bucketId, fileId, encryptionKey, token, options } = params;
  const { name: clientName, version: clientVersion } = appInfo;

  return new NetworkFacade(
    Network.client(
      process.env.DRIVE_URL,
      {
        clientName,
        clientVersion,
        desktopHeader: process.env.DESKTOP_HEADER,
      },
      {
        bridgeUser: '',
        userId: '',
      },
    ),
  ).download(bucketId, fileId, '', {
    key: Buffer.from(encryptionKey, 'hex'),
    token,
    downloadingCallback: options?.notifyProgress,
    abortController: options?.abortController,
  });
};

function getAuthFromCredentials(creds: NetworkCredentials): { username: string; password: string } {
  return {
    username: creds.user,
    password: sha256(Buffer.from(creds.pass)).toString('hex'),
  };
}

const downloadOwnFile: DownloadOwnFileFunction = (params) => {
  const { bucketId, fileId, mnemonic, options } = params;
  const { name: clientName, version: clientVersion } = appInfo;
  const auth = getAuthFromCredentials(params.creds);

  return new NetworkFacade(
    Network.client(
      process.env.DRIVE_URL,
      {
        clientName,
        clientVersion,
        desktopHeader: process.env.DESKTOP_HEADER,
      },
      {
        bridgeUser: auth.username,
        userId: auth.password,
      },
    ),
  ).download(bucketId, fileId, mnemonic, {
    downloadingCallback: options?.notifyProgress,
    abortController: options?.abortController,
  });
};

const downloadFileV2: DownloadFileFunction = (params) => {
  if (params.token && params.encryptionKey) {
    return downloadSharedFile(params);
  } else if (params.creds && params.mnemonic) {
    return downloadOwnFile(params);
  } else {
    // TODO: this log should be removed when the code is stable
    logger.debug({
      msg: 'Download file params are missing',
      params,
    });
    throw new Error('DOWNLOAD ERRNO. 0');
  }
};

export default downloadFileV2;

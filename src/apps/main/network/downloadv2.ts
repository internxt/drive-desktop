import { Network } from '@internxt/sdk/dist/network';
import { sha256 } from './requests';
import { NetworkFacade } from './NetworkFacade';
import { ReadableStream } from 'node:stream/web';
import { appInfo } from '../app-info/app-info';

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
  const desktopHeader = process.env.INTERNXT_DESKTOP_HEADER_KEY;
  return new NetworkFacade(
    Network.client(
      process.env.BRIDGE_URL as string,
      {
        clientName,
        clientVersion,
        desktopHeader,
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
  const desktopHeader = process.env.INTERNXT_DESKTOP_HEADER_KEY;
  return new NetworkFacade(
    Network.client(
      process.env.BRIDGE_URL as string,
      {
        clientName,
        clientVersion,
        desktopHeader,
      },
      {
        bridgeUser: auth.username,
        userId: auth.password,
      }
    )
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
    throw new Error('DOWNLOAD ERRNO. 0');
  }
};

export default downloadFileV2;

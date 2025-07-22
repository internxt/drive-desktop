import { DownloadProgressCallback } from '@internxt/inxt-js/build/lib/core';
import { NetworkCredentials } from './types';

export interface IDownloadParams {
  bucketId: string;
  fileId: string;
  creds: NetworkCredentials;
  mnemonic: string;
  options: {
    abortController?: AbortController;
    notifyProgress: DownloadProgressCallback;
  };
}

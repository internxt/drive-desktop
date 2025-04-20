import { DownloadProgressCallback } from '@internxt/inxt-js/build/lib/core';
import { NetworkCredentials } from './requests';

export interface IDownloadParams {
  networkApiUrl: string;
  bucketId: string;
  fileId: string;
  creds: NetworkCredentials;
  mnemonic: string;
  options: {
    abortController?: AbortController;
    notifyProgress: DownloadProgressCallback;
  };
}

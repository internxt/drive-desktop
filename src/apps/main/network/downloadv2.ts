import { Network } from '@internxt/sdk/dist/network';
import { NetworkCredentials, sha256 } from './requests';
import { NetworkFacade } from './NetworkFacade';
import { IDownloadParams } from './download.types';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

function getAuthFromCredentials(creds: NetworkCredentials): { username: string; password: string } {
  return {
    username: creds.user,
    password: sha256(Buffer.from(creds.pass)).toString('hex'),
  };
}

function downloadOwnFile(params: IDownloadParams) {
  const { bucketId, fileId, mnemonic, options } = params;
  const auth = getAuthFromCredentials(params.creds);

  return new NetworkFacade(
    Network.client(
      process.env.DRIVE_URL,
      {
        clientName: INTERNXT_CLIENT,
        clientVersion: INTERNXT_VERSION,
        desktopHeader: process.env.DESKTOP_HEADER,
      },
      {
        bridgeUser: auth.username,
        userId: auth.password,
      },
    ),
  ).download(bucketId, fileId, mnemonic, {
    notifyProgress: options.notifyProgress,
    abortController: options.abortController,
  });
}

export function downloadFileV2(params: IDownloadParams) {
  if (params.creds && params.mnemonic) {
    return downloadOwnFile(params);
  } else {
    throw new Error('DOWNLOAD ERRNO. 0');
  }
}

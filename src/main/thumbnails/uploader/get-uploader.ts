import { Environment } from '@internxt/inxt-js';
import { Storage } from '@internxt/sdk/dist/drive';
import { getToken, getUser } from '../../auth/service';
import { ThumbnailUploader } from './ThumbnailUploader';
import { onUserUnauthorized } from '../../auth/handlers';
import ConfigStore from '../../config';

import packageJson from '../../../../package.json';

let thumbnailUploader: ThumbnailUploader | null;

function createStorageClient() {
  return Storage.client(
    process.env.DRIVE_URL,
    { clientName: 'drive-desktop', clientVersion: packageJson.version },
    {
      token: getToken(),
      mnemonic: ConfigStore.get('mnemonic'),
      unauthorizedCallback: onUserUnauthorized,
    }
  );
}

export function getUploader() {
  if (thumbnailUploader) return thumbnailUploader;

  const user = getUser();

  if (!user) return;

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: user.mnemonic,
  });

  const storgae = createStorageClient();

  thumbnailUploader = new ThumbnailUploader(environment, storgae, user.bucket);

  return thumbnailUploader;
}

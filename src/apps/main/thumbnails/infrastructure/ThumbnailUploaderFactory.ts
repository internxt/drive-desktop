import { Environment } from '@internxt/inxt-js';
import { Storage } from '@internxt/sdk/dist/drive';

import { appInfo } from '../../app-info/app-info';
import { onUserUnauthorized } from '../../auth/handlers';
import { getUser, obtainToken } from '../../auth/service';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';
import { getConfig } from '@/apps/sync-engine/config';

export class ThumbnailUploaderFactory {
  private static instance: EnvironmentAndStorageThumbnailUploader | null;

  private static createStorageClient() {
    const { name: clientName, version: clientVersion } = appInfo;

    return Storage.client(
      process.env.API_URL,
      { clientName, clientVersion },
      {
        token: obtainToken('bearerToken'),
        unauthorizedCallback: onUserUnauthorized,
      },
    );
  }

  static build() {
    if (ThumbnailUploaderFactory.instance) {
      return ThumbnailUploaderFactory.instance;
    }

    const user = getUser();

    if (!user) {
      throw new Error('[THUMBNAIL] Thumbnail uploader could not be created: user missing');
    }

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: getConfig().bridgeUser,
      bridgePass: getConfig().bridgePass,
      encryptionKey: getConfig().mnemonic,
    });

    const storage = ThumbnailUploaderFactory.createStorageClient();

    ThumbnailUploaderFactory.instance = new EnvironmentAndStorageThumbnailUploader(environment, storage, getConfig().bucket);

    return ThumbnailUploaderFactory.instance;
  }
}

import { Environment } from '@internxt/inxt-js';
import { Storage } from '@internxt/sdk/dist/drive';

import { appInfo } from '../../app-info/app-info';
import { onUserUnauthorized } from '../../auth/handlers';
import { getUser, obtainToken } from '../../auth/service';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';

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
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      encryptionKey: user.mnemonic,
    });

    const storage = ThumbnailUploaderFactory.createStorageClient();

    ThumbnailUploaderFactory.instance = new EnvironmentAndStorageThumbnailUploader(environment, storage, user.bucket);

    return ThumbnailUploaderFactory.instance;
  }
}

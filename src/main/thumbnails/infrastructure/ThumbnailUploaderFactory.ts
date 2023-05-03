import { Environment } from '@internxt/inxt-js';
import { Storage } from '@internxt/sdk/dist/drive';

import { appInfo } from '../../app-info/app-info';
import { onUserUnauthorized } from '../../auth/handlers';
import { getUser, obtainToken } from '../../auth/service';
import { ThumbnailUploader } from '../domain/ThumbnailUploader';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';

export class ThumbnailUploaderFactory {
  private static instance: ThumbnailUploader | null;

  private static createStorageClient() {
    const { name: clientName, version: clientVersion } = appInfo;

    return Storage.client(
      process.env.DRIVE_API_URL,
      { clientName, clientVersion },
      {
        token: obtainToken('bearerToken'),
        unauthorizedCallback: onUserUnauthorized,
      }
    );
  }

  static build(): ThumbnailUploader {
    if (ThumbnailUploaderFactory.instance) {
      return ThumbnailUploaderFactory.instance;
    }

    const user = getUser();

    if (!user) {
      throw new Error(
        '[THUMBNAIL] Thumbnail uploader could not be created: user missing'
      );
    }

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: user.bridgeUser,
      bridgePass: user.userId,
      encryptionKey: user.mnemonic,
    });

    const storgae = ThumbnailUploaderFactory.createStorageClient();

    ThumbnailUploaderFactory.instance =
      new EnvironmentAndStorageThumbnailUploader(
        environment,
        storgae,
        user.bucket
      );

    return ThumbnailUploaderFactory.instance;
  }
}

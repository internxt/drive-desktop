import { Environment } from '@internxt/inxt-js';
import { Storage } from '@internxt/sdk/dist/drive';
import { obtainToken, getUser } from '../../auth/service';
import { EnvironmentAndStorageThumbnailUploader } from './ThumbnailUploader';
import { onUserUnauthorized } from '../../auth/handlers';
import ConfigStore from '../../config';
import { appInfo } from '../../app-info/app-info';
import { ThumbnailUploader } from '../domain/ThumbnailUploader';

export class ThumbnailUploaderFactory {
  private static instance: ThumbnailUploader | null;

  private static createStorageClient() {
    const { name: clientName, version: clientVersion } = appInfo;

    return Storage.client(
      process.env.DRIVE_API_URL,
      { clientName, clientVersion },
      {
        token: obtainToken('bearerToken'),
        mnemonic: ConfigStore.get('mnemonic'),
        unauthorizedCallback: onUserUnauthorized,
      }
    );
  }

  static build(): ThumbnailUploader {
    if (ThumbnailUploaderFactory.instance)
      return ThumbnailUploaderFactory.instance;

    const user = getUser();

    if (!user)
      throw new Error(
        '[THUMBNAIL] Thumbnail uploader could not be created: user missing'
      );

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

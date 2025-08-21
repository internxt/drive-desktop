import { INTERNXT_CLIENT, INTERNXT_VERSION } from './../../../../core/utils/utils';
import { Environment } from '@internxt/inxt-js';

import { getUser } from '../../auth/service';
import { ThumbnailUploader } from '../domain/ThumbnailUploader';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';

export class ThumbnailUploaderFactory {
  private static instance: ThumbnailUploader | null;

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
      appDetails: {
        clientName: INTERNXT_CLIENT,
        clientVersion: INTERNXT_VERSION,
        desktopHeader: process.env.DESKTOP_HEADER,
      }
    });

    ThumbnailUploaderFactory.instance =
      new EnvironmentAndStorageThumbnailUploader(
        environment,
        user.bucket
      );

    return ThumbnailUploaderFactory.instance;
  }
}

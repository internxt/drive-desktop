import { Environment } from '@internxt/inxt-js';

import { getUser } from '../../auth/service';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';
import { getConfig } from '@/apps/sync-engine/config';

export class ThumbnailUploaderFactory {
  private static instance: EnvironmentAndStorageThumbnailUploader | null;

  static build() {
    if (ThumbnailUploaderFactory.instance) {
      return ThumbnailUploaderFactory.instance;
    }

    const user = getUser();

    if (!user) {
      throw new Error('[THUMBNAIL] Thumbnail uploader could not be created: user missing');
    }

    const environment = new Environment({
      bridgeUrl: process.env.DRIVE_URL,
      bridgeUser: getConfig().bridgeUser,
      bridgePass: getConfig().bridgePass,
      encryptionKey: getConfig().mnemonic,
    });

    ThumbnailUploaderFactory.instance = new EnvironmentAndStorageThumbnailUploader(environment, getConfig().bucket);

    return ThumbnailUploaderFactory.instance;
  }
}

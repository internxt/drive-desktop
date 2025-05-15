import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';
import { getConfig } from '@/apps/sync-engine/config';

export class ThumbnailUploaderFactory {
  private static instance: EnvironmentAndStorageThumbnailUploader | null;

  static build(bucket: string) {
    if (ThumbnailUploaderFactory.instance) {
      return ThumbnailUploaderFactory.instance;
    }

    const environment = new Environment({
      bridgeUrl: process.env.DRIVE_URL,
      bridgeUser: getConfig().bridgeUser,
      bridgePass: getConfig().bridgePass,
      encryptionKey: getConfig().mnemonic,
    });

    ThumbnailUploaderFactory.instance = new EnvironmentAndStorageThumbnailUploader(environment, bucket);

    return ThumbnailUploaderFactory.instance;
  }
}

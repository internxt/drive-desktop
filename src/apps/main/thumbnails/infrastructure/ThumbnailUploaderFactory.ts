import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentAndStorageThumbnailUploader } from './EnvironmentAndStorageThumbnailUploader';
import { getConfig } from '@/apps/sync-engine/config';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

export class ThumbnailUploaderFactory {
  private static instance: EnvironmentAndStorageThumbnailUploader | null;

  static build(bucket: string) {
    if (ThumbnailUploaderFactory.instance) {
      return ThumbnailUploaderFactory.instance;
    }

    const environment = new Environment({
      bridgeUrl: process.env.BRIDGE_URL,
      bridgeUser: getConfig().bridgeUser,
      bridgePass: getConfig().bridgePass,
      encryptionKey: getConfig().mnemonic,
      appDetails: {
        clientName: INTERNXT_CLIENT,
        clientVersion: INTERNXT_VERSION,
        desktopHeader: process.env.DESKTOP_HEADER,
      },
    });

    ThumbnailUploaderFactory.instance = new EnvironmentAndStorageThumbnailUploader(environment, bucket);

    return ThumbnailUploaderFactory.instance;
  }
}

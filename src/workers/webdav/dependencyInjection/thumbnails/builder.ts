import { Environment } from '@internxt/inxt-js';
import { ThumbnailsDownloader } from '../../modules/thumbnails/application/ThumbnailsDownloader';
import { EnvironmentThumbnailDownloader } from '../../modules/thumbnails/infrastructrue/EnvironmentThumbnailDownloader';
import { DOWNLOADED_THUMBNAILS_FOLDER } from '../../thumbnails';
import { DepenedencyInjectionMnemonicProvider } from '../common/mnemonic';
import { DepenedencyInjectionUserProvider } from '../common/user';
import { ThumbnailsContainer } from './ThumbnailsContainer';

export function buildThumbnailsContainer(): ThumbnailsContainer {
  const user = DepenedencyInjectionUserProvider.get();
  const mnemonic = DepenedencyInjectionMnemonicProvider.get();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  const environmentThumbnailDownloader = new EnvironmentThumbnailDownloader(
    environment.download,
    user.bucket
  );
  const downloader = new ThumbnailsDownloader(
    DOWNLOADED_THUMBNAILS_FOLDER,
    environmentThumbnailDownloader
  );

  return {
    thumbnailsDownloader: downloader,
  };
}

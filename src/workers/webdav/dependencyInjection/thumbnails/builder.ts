import { Environment } from '@internxt/inxt-js';
import { ThumbnailsDownloader } from '../../modules/thumbnails/application/ThumbnailsDownloader';
import { EnvironmentThumbnailDownloader } from '../../modules/thumbnails/infrastructrue/EnvironmentThumbnailDownloader';
import { DepenedencyInjectionMnemonicProvider } from '../common/mnemonic';
import { DepenedencyInjectionUserProvider } from '../common/user';
import { ThumbnailsContainer } from './ThumbnailsContainer';
import { ipcRenderer } from 'electron';

export async function buildThumbnailsContainer(): Promise<ThumbnailsContainer> {
  const user = DepenedencyInjectionUserProvider.get();
  const mnemonic = DepenedencyInjectionMnemonicProvider.get();
  const downloadedThumbnailsFolder = await ipcRenderer.invoke(
    'GET_LOCAL_THUMBNAIL_FOLDER'
  );

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
    downloadedThumbnailsFolder,
    environmentThumbnailDownloader
  );

  return {
    thumbnailsDownloader: downloader,
  };
}

import { Environment } from '@internxt/inxt-js/build';
import { SharedContainer } from '../shared/SharedContainer';
import { ContentsContainer } from './ContentsContainer';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { ContentsUploader } from '../../../../context/virtual-drive/contents/application/ContentsUploader';
import { temporalFolderProvider } from '../../../../context/virtual-drive/contents/application/temporalFolderProvider';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileWriter } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileWriter';
import { getConfig } from '../../config';

export function buildContentsContainer(sharedContainer: SharedContainer): ContentsContainer {
  const environment = new Environment({
    bridgeUrl: process.env.DRIVE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: getConfig().mnemonic,
  });

  const contentsManagerFactory = new EnvironmentRemoteFileContentsManagersFactory(environment, getConfig().bucket);

  const contentsUploader = new ContentsUploader(contentsManagerFactory, sharedContainer.relativePathToAbsoluteConverter);

  const localWriter = new FSLocalFileWriter(temporalFolderProvider);

  const contentsDownloader = new ContentsDownloader(contentsManagerFactory, localWriter, temporalFolderProvider);

  return {
    contentsUploader,
    contentsDownloader,
    temporalFolderProvider,
    contentsManagerFactory,
  };
}

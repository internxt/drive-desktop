import { Environment } from '@internxt/inxt-js';
import { DependencyInjectionMnemonicProvider } from '../common/mnemonic';
import { SharedContainer } from '../shared/SharedContainer';
import { ContentsContainer } from './ContentsContainer';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { ContentsDownloader } from '../../../../context/virtual-drive/contents/application/ContentsDownloader';
import { ContentsUploader } from '../../../../context/virtual-drive/contents/application/ContentsUploader';
import { RetryContentsUploader } from '../../../../context/virtual-drive/contents/application/RetryContentsUploader';
import { temporalFolderProvider } from '../../../../context/virtual-drive/contents/application/temporalFolderProvider';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileProvider';
import { FSLocalFileWriter } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileWriter';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { getConfig } from '../../config';

export async function buildContentsContainer(sharedContainer: SharedContainer): Promise<ContentsContainer> {
  const mnemonic = DependencyInjectionMnemonicProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;

  const environment = new Environment({
    bridgeUrl: process.env.DRIVE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: mnemonic,
  });

  const contentsManagerFactory = new EnvironmentRemoteFileContentsManagersFactory(environment, getConfig().bucket);

  const contentsProvider = new FSLocalFileProvider();
  const contentsUploader = new ContentsUploader(
    contentsManagerFactory,
    contentsProvider,
    ipcRendererSyncEngine,
    sharedContainer.relativePathToAbsoluteConverter,
  );

  const retryContentsUploader = new RetryContentsUploader(contentsUploader);

  const localWriter = new FSLocalFileWriter(temporalFolderProvider);

  const contentsDownloader = new ContentsDownloader(
    contentsManagerFactory,
    localWriter,
    ipcRendererSyncEngine,
    temporalFolderProvider,
    eventBus,
  );

  return {
    contentsUploader: retryContentsUploader,
    contentsDownloader,
    temporalFolderProvider,
    contentsManagerFactory,
  };
}

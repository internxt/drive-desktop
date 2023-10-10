import { Environment } from '@internxt/inxt-js';
import { RetryContentsUploader } from 'workers/sync-engine/modules/contents/application/RetryContentsUploader';
import { FSLocalFileWriter } from 'workers/sync-engine/modules/contents/infrastructure/FSLocalFileWriter';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { ContentsUploader } from '../../modules/contents/application/ContentsUploader';
import { temporalFolderProvider } from '../../modules/contents/application/temporalFolderProvider';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../modules/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileProvider } from '../../modules/contents/infrastructure/FSLocalFileProvider';
import { DependencyInjectionMnemonicProvider } from '../common/mnemonic';
import { DependencyInjectionUserProvider } from '../common/user';
import { SharedContainer } from '../shared/SharedContainer';
import { ContentsContainer } from './ContentsContainer';

export async function buildContentsContainer(
  sharedContainer: SharedContainer
): Promise<ContentsContainer> {
  const user = DependencyInjectionUserProvider.get();
  const mnemonic = DependencyInjectionMnemonicProvider.get();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  const contentsManagerFactory =
    new EnvironmentRemoteFileContentsManagersFactory(environment, user.bucket);

  const contentsProvider = new FSLocalFileProvider();
  const contentsUploader = new ContentsUploader(
    contentsManagerFactory,
    contentsProvider,
    ipcRendererSyncEngine,
    sharedContainer.relativePathToAbsoluteConverter
  );

  const retryContentsUploader = new RetryContentsUploader(contentsUploader);

  const localWriter = new FSLocalFileWriter(temporalFolderProvider);

  const contentsDownloader = new ContentsDownloader(
    contentsManagerFactory,
    localWriter,
    ipcRendererSyncEngine,
    temporalFolderProvider
  );

  return {
    contentsUploader: retryContentsUploader,
    contentsDownloader,
    temporalFolderProvider,
  };
}

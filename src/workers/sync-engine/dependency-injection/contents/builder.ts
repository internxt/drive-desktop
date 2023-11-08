import { Environment } from '@internxt/inxt-js';
import { RetryContentsUploader } from '../../modules/contents/application/RetryContentsUploader';
import { FSLocalFileWriter } from '../../modules/contents/infrastructure/FSLocalFileWriter';
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
import { DependencyInjectionEventBus } from '../common/eventBus';
import { NotifyMainProcessHydrationFinished } from 'workers/sync-engine/modules/contents/application/NotifyMainProcessHydrationFinished';
import { DependencyInjectionEventRepository } from '../common/eventRepository';

export async function buildContentsContainer(
  sharedContainer: SharedContainer
): Promise<ContentsContainer> {
  const user = DependencyInjectionUserProvider.get();
  const mnemonic = DependencyInjectionMnemonicProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;
  const eventRepository = DependencyInjectionEventRepository.get();

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
    temporalFolderProvider,
    eventBus
  );

  const notifyMainProcessHydrationFinished =
    new NotifyMainProcessHydrationFinished(
      eventRepository,
      ipcRendererSyncEngine
    );

  return {
    contentsUploader: retryContentsUploader,
    contentsDownloader,
    temporalFolderProvider,
    notifyMainProcessHydrationFinished,
  };
}

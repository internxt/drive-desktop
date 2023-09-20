import { Environment } from '@internxt/inxt-js';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { FSLocalFileProvider } from '../../modules/contents/infrastructure/FSLocalFileProvider';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { ipcRenderer } from 'electron';
import { ContentsUploader } from '../../modules/contents/application/ContentsUploader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../modules/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { DependencyInjectionMnemonicProvider } from '../common/mnemonic';
import { DependencyInjectionUserProvider } from '../common/user';
import { ContentsContainer } from './ContentsContainer';
import { FSLocalFileWriter } from 'workers/sync-engine/modules/contents/infrastructure/FSLocalFileWriter';

export async function buildContentsContainer(): Promise<ContentsContainer> {
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
    ipcRendererSyncEngine
  );

  const temporalFolderProvider = async (): Promise<string> => {
    const temporalFilesFolder = await ipcRenderer.invoke(
      'APP:TEMPORAL_FILES_FOLDER'
    );

    if (typeof temporalFilesFolder !== 'string') {
      throw new Error('Temporal folder path is not a string ');
    }

    return temporalFilesFolder;
  };

  const localWriter = new FSLocalFileWriter(temporalFolderProvider);

  const contentsDownloader = new ContentsDownloader(
    contentsManagerFactory,
    localWriter,
    ipcRendererSyncEngine
  );

  return {
    contentsUploader,
    contentsDownloader,
  };
}

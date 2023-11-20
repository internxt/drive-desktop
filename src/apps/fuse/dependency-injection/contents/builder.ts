import { Environment } from '@internxt/inxt-js';
import { DownloadContentsToPlainFile } from '../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { ContentsContainer } from './ContentsContainer';
import { DependencyInjectionUserProvider } from '../common/user';
import { DependencyInjectionMnemonicProvider } from '../common/mnemonic';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileWriter } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileWriter';
import { app } from 'electron';
import { DependencyInjectionEventBus } from '../common/eventBus';

export async function buildContentsContainer(): Promise<ContentsContainer> {
  const user = DependencyInjectionUserProvider.get();
  const mnemonic = DependencyInjectionMnemonicProvider.get();
  const { bus: eventBus } = DependencyInjectionEventBus;

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  const contentsManagerFactory =
    new EnvironmentRemoteFileContentsManagersFactory(environment, user.bucket);

  const temporalFolderProvider = () => {
    return Promise.resolve(app.getPath('temp'));
  };

  const localWriter = new FSLocalFileWriter(temporalFolderProvider);

  const downloadContentsToPlainFile = new DownloadContentsToPlainFile(
    contentsManagerFactory,
    localWriter,
    eventBus
  );

  return {
    downloadContentsToPlainFile,
  };
}

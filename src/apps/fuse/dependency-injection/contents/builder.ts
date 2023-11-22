import { Environment } from '@internxt/inxt-js';
import { DownloadContentsToPlainFile } from '../../../../context/virtual-drive/contents/application/DownloadContentsToPlainFile';
import { ContentsContainer } from './ContentsContainer';
import { DependencyInjectionUserProvider } from '../common/user';
import { DependencyInjectionMnemonicProvider } from '../common/mnemonic';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../../../context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { FSLocalFileSystem } from '../../../../context/virtual-drive/contents/infrastructure/FSLocalFileSystem';
import { DependencyInjectionEventBus } from '../common/eventBus';
import { FuseAppDataLocalFileContentsDirectoryProvider } from '../../../../context/virtual-drive/shared/infrastructure/LocalFileContentsDirectoryProviders/FuseAppDataLocalFileContentsDirectoryProvider';

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

  const localFileContentsDirectoryProvider =
    new FuseAppDataLocalFileContentsDirectoryProvider();

  const localWriter = new FSLocalFileSystem(
    localFileContentsDirectoryProvider,
    'downloaded'
  );

  const downloadContentsToPlainFile = new DownloadContentsToPlainFile(
    contentsManagerFactory,
    localWriter,
    eventBus
  );

  return {
    downloadContentsToPlainFile,
  };
}

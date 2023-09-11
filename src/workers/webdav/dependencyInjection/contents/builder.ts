import { EnvironmentRemoteFileContentsManagersFactory } from '../../modules/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { ContentsUploader } from '../../modules/contents/application/ContentsUploader';
import { ContentsContainer } from './ContentsContainer';
import { DepenedencyInjectionUserProvider } from '../common/user';
import { DepenedencyInjectionMnemonicProvider } from '../common/mnemonic';
import { Environment } from '@internxt/inxt-js';
import { FSLocalFileProvider } from 'workers/webdav/modules/contents/infrastructure/FSLocalFileProvider';
import { ipc } from '../../ipc';

export function buildContentsContainer(): ContentsContainer {
  const user = DepenedencyInjectionUserProvider.get();
  const mnemonic = DepenedencyInjectionMnemonicProvider.get();

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
    ipc
  );

  return {
    contentsUploader,
  };
}

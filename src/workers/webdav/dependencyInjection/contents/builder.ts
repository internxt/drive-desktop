import { Environment } from '@internxt/inxt-js';
import { ContentsDownloader } from '../../modules/contents/application/ContentsDownloader';
import { FSLocalFileProvider } from '../../modules/contents/infrastructure/FSLocalFileProvider';
import { ipc } from '../../ipc';
import { ContentsUploader } from '../../modules/contents/application/ContentsUploader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../../modules/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { DepenedencyInjectionMnemonicProvider } from '../common/mnemonic';
import { DepenedencyInjectionUserProvider } from '../common/user';
import { ContentsContainer } from './ContentsContainer';

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

  const contentsDownloader = new ContentsDownloader(
    contentsManagerFactory,
    ipc
  );

  return {
    contentsUploader,
    contentsDownloader,
  };
}

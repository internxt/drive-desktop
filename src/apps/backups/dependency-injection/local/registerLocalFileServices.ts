import { INTERNXT_CLIENT, INTERNXT_VERSION } from './../../../../core/utils/utils';
import { ContainerBuilder } from 'diod';
import { FileBatchUpdater } from '../../../../context/local/localFile/application/update/FileBatchUpdater';
import { LocalFileHandler } from '../../../../context/local/localFile/domain/LocalFileUploader';
import { FileBatchUploader } from '../../../../context/local/localFile/application/upload/FileBatchUploader';
import { SimpleFileCreator } from '../../../../context/virtual-drive/files/application/create/SimpleFileCreator';
import { EnvironmentLocalFileUploader } from '../../../../context/local/localFile/infrastructure/EnvironmentLocalFileUploader';
import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';
import { Environment } from '@internxt/inxt-js';
import { DependencyInjectionMnemonicProvider } from '../../../shared/dependency-injection/DependencyInjectionMnemonicProvider';

export function registerLocalFileServices(builder: ContainerBuilder) {
  //Infra
  const user = DependencyInjectionUserProvider.get();
  const mnemonic = DependencyInjectionMnemonicProvider.get();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
    appDetails: {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.INTERNXT_DESKTOP_HEADER_KEY,
    },
  });

  builder.register(Environment).useInstance(environment).private();

  builder
    .register(LocalFileHandler)
    .useFactory((c) => {
      const env = c.get(Environment);
      return new EnvironmentLocalFileUploader(env, user.backupsBucket);
    })
    .private();

  // Services
  builder.registerAndUse(FileBatchUpdater);
  builder.register(FileBatchUploader).useFactory((c) => {
    return new FileBatchUploader(c.get(LocalFileHandler), c.get(SimpleFileCreator), user.backupsBucket);
  });
}

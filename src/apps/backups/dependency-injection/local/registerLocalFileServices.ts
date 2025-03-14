import Logger from 'electron-log';
import { ContainerBuilder } from 'diod';
import { FileBatchUpdater } from '../../../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../../../context/local/localFile/application/upload/FileBatchUploader';
import { EnvironmentLocalFileUploader } from '../../../../context/local/localFile/infrastructure/EnvironmentLocalFileUploader';
import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';
import { Environment } from '@internxt/inxt-js';
import { DependencyInjectionMnemonicProvider } from '../../../shared/dependency-injection/DependencyInjectionMnemonicProvider';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { RendererIpcLocalFileMessenger } from '../../../../context/local/localFile/infrastructure/RendererIpcLocalFileMessenger';
import { getConfig } from '@/apps/sync-engine/config';
import { ENV } from '@/core/env/env';

export async function registerLocalFileServices(builder: ContainerBuilder) {
  //Infra
  const user = DependencyInjectionUserProvider.get();

  const mnemonic = DependencyInjectionMnemonicProvider.get();

  const environment = new Environment({
    bridgeUrl: ENV.BRIDGE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: mnemonic,
  });

  Logger.info('Registering local file services');

  builder.register(Environment).useInstance(environment).private();

  builder
    .register(EnvironmentLocalFileUploader)
    .useFactory(
      (c) =>
        new EnvironmentLocalFileUploader(
          c.get(Environment),
          user.backupsBucket,
          //@ts-ignore
          c.get(AuthorizedClients).drive,
        ),
    )
    .private();

  builder.register(RendererIpcLocalFileMessenger).useClass(RendererIpcLocalFileMessenger).private().asSingleton();

  // Services
  builder.registerAndUse(FileBatchUpdater);
  builder.registerAndUse(FileBatchUploader);
}

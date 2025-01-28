import { ContainerBuilder } from 'diod';
import { FileBatchUpdater } from '../../../../context/local/localFile/application/update/FileBatchUpdater';
import { LocalFileHandler } from '../../../../context/local/localFile/domain/LocalFileUploader';
import { FileBatchUploader } from '../../../../context/local/localFile/application/upload/FileBatchUploader';
import { EnvironmentLocalFileUploader } from '../../../../context/local/localFile/infrastructure/EnvironmentLocalFileUploader';
import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';
import { Environment } from '@internxt/inxt-js';
import { DependencyInjectionMnemonicProvider } from '../../../shared/dependency-injection/DependencyInjectionMnemonicProvider';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { LocalFileMessenger } from '../../../../context/local/localFile/domain/LocalFileMessenger';
import { RendererIpcLocalFileMessenger } from '../../../../context/local/localFile/infrastructure/RendererIpcLocalFileMessenger';
import Logger from 'electron-log';

export function registerLocalFileServices(builder: ContainerBuilder) {
  //Infra
  const user = DependencyInjectionUserProvider.get();
  const mnemonic = DependencyInjectionMnemonicProvider.get();

  const environment = new Environment({
    bridgeUrl: process.env.BRIDGE_URL,
    bridgeUser: user.bridgeUser,
    bridgePass: user.userId,
    encryptionKey: mnemonic,
  });

  // Log the environment configuration
  Logger.info('Environment configuration:', {
    bridgeUrl: environment.config.bridgeUrl,
    bridgeUser: environment.config.bridgeUser,
    bridgePass: environment.config.bridgePass,
    encryptionKey: environment.config.encryptionKey,
  });

  builder.register(Environment).useInstance(environment).private();

  builder
    .register(LocalFileHandler)
    .useFactory((c) => {
      const env = c.get(Environment);
      // Log the environment retrieved from the container
      Logger.debug('Environment:', env);

      return new EnvironmentLocalFileUploader(
        env,
        user.backupsBucket,
        //@ts-ignore
        c.get(AuthorizedClients).drive
      );
    })
    .private();

  builder
    .register(LocalFileMessenger)
    .useClass(RendererIpcLocalFileMessenger)
    .private()
    .asSingleton();

  // Services
  builder.registerAndUse(FileBatchUpdater);
  builder.registerAndUse(FileBatchUploader);
}

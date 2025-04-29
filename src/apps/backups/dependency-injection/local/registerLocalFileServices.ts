import Logger from 'electron-log';
import { ContainerBuilder } from 'diod';
import { FileBatchUpdater } from '../../../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../../../context/local/localFile/application/upload/FileBatchUploader';
import { EnvironmentLocalFileUploader } from '../../../../context/local/localFile/infrastructure/EnvironmentLocalFileUploader';
import { Environment } from '@internxt/inxt-js';
import { RendererIpcLocalFileMessenger } from '../../../../context/local/localFile/infrastructure/RendererIpcLocalFileMessenger';
import { getConfig } from '@/apps/sync-engine/config';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';

export async function registerLocalFileServices(builder: ContainerBuilder) {
  //Infra

  const mnemonic = getConfig().mnemonic;

  const environment = new Environment({
    bridgeUrl: process.env.DRIVE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: mnemonic,
  });

  Logger.info('Registering local file services');

  builder.register(Environment).useInstance(environment).private();

  Logger.info('[BackupsDependencyContainerFactory] Registering network services.');

  builder.register(EnvironmentRemoteFileContentsManagersFactory).useFactory((c) => {
    return new EnvironmentRemoteFileContentsManagersFactory(c.get(Environment), getConfig().bucket);
  });

  builder
    .register(EnvironmentLocalFileUploader)
    .useFactory((c) => new EnvironmentLocalFileUploader(c.get(Environment), getConfig().bucket))
    .private();

  builder.register(RendererIpcLocalFileMessenger).useClass(RendererIpcLocalFileMessenger).private().asSingleton();

  // Services
  builder.registerAndUse(FileBatchUpdater);
  builder.registerAndUse(FileBatchUploader);
}

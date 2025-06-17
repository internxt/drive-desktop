import { ContainerBuilder } from 'diod';
import { FileBatchUpdater } from '../../../../context/local/localFile/application/update/FileBatchUpdater';
import { FileBatchUploader } from '../../../../context/local/localFile/application/upload/FileBatchUploader';
import { Environment } from '@internxt/inxt-js/build';
import { getConfig } from '@/apps/sync-engine/config';
import { EnvironmentRemoteFileContentsManagersFactory } from '@/context/virtual-drive/contents/infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { BackupInfo } from '../../BackupInfo';
import { EnvironmentFileUploader } from '@/infra/inxt-js/services/environment-file-uploader';
import { logger } from '@/apps/shared/logger/logger';

export function registerLocalFileServices(builder: ContainerBuilder, data: BackupInfo) {
  //Infra

  const environment = new Environment({
    bridgeUrl: process.env.DRIVE_URL,
    bridgeUser: getConfig().bridgeUser,
    bridgePass: getConfig().bridgePass,
    encryptionKey: getConfig().mnemonic,
  });

  logger.debug({ tag: 'BACKUPS', msg: 'Registering local file services' });

  builder.register(Environment).useInstance(environment).private();

  logger.debug({ tag: 'BACKUPS', msg: 'Registering network services.' });

  builder.register(EnvironmentRemoteFileContentsManagersFactory).useFactory((c) => {
    return new EnvironmentRemoteFileContentsManagersFactory(c.get(Environment), data.backupsBucket);
  });

  builder
    .register(EnvironmentFileUploader)
    .useFactory((c) => new EnvironmentFileUploader(c.get(Environment), data.backupsBucket))
    .private();

  // Services
  builder.registerAndUse(FileBatchUpdater);
  builder.registerAndUse(FileBatchUploader);
}

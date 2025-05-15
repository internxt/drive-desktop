import { ContainerBuilder } from 'diod';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { SimpleFileCreator } from '../../../../context/virtual-drive/files/application/create/SimpleFileCreator';
import { BackupInfo } from '../../BackupInfo';

export function registerFilesServices(builder: ContainerBuilder, data: BackupInfo) {
  // Infra

  builder
    .register(HttpRemoteFileSystem)
    .useFactory(() => new HttpRemoteFileSystem(data.backupsBucket))
    .private();

  // Services

  builder.registerAndUse(SimpleFileCreator);
}

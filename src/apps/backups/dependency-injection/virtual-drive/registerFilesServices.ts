import { ContainerBuilder } from 'diod';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { BackupInfo } from '../../BackupInfo';

export function registerFilesServices(builder: ContainerBuilder, data: BackupInfo) {
  builder
    .register(HttpRemoteFileSystem)
    .useFactory(() => new HttpRemoteFileSystem(data.backupsBucket))
    .private();
}

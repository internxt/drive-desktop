import { ContainerBuilder } from 'diod';
import { SimpleFolderCreator } from '../../../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { RemoteFileSystem } from '../../../../context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';

export function registerFolderServices(builder: ContainerBuilder) {
  builder
    .register(RemoteFileSystem)
    .useFactory(() => {
      return new HttpRemoteFileSystem();
    })
    .private();

  builder.registerAndUse(SimpleFolderCreator);
}

import { ContainerBuilder } from 'diod';
import { SimpleFolderCreator } from '../../../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';

export function registerFolderServices(builder: ContainerBuilder) {
  builder
    .register(HttpRemoteFolderSystem)
    .useFactory(() => {
      return new HttpRemoteFolderSystem();
    })
    .private();

  builder.registerAndUse(SimpleFolderCreator);
}

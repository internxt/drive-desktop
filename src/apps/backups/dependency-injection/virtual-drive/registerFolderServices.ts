import { ContainerBuilder } from 'diod';
import { SimpleFolderCreator } from '../../../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { RemoteFileSystem } from '../../../../context/virtual-drive/folders/domain/file-systems/RemoteFileSystem';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFileSystem';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';

export function registerFolderServices(builder: ContainerBuilder) {
  builder
    .register(RemoteFileSystem)
    .useFactory((c) => {
      const clients = c.get(AuthorizedClients);
      return new HttpRemoteFileSystem(
        // @ts-ignore
        clients.newDrive
      );
    })
    .private();

  builder.registerAndUse(SimpleFolderCreator);
}

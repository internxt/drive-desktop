import { ContainerBuilder } from 'diod';
import { SimpleFolderCreator } from '../../../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { HttpRemoteFolderSystem } from '../../../../context/virtual-drive/folders/infrastructure/HttpRemoteFolderSystem';
import { RemoteFolderSystem } from '../../../../context/virtual-drive/folders/domain/file-systems/RemoteFolderSystem';
import { FolderDeleter } from '../../../../context/virtual-drive/folders/application/delete/FolderDeleter';

export async function registerFolderServices(builder: ContainerBuilder) {
  builder
    .register(RemoteFolderSystem)
    .useFactory((c) => {
      const clients = c.get(AuthorizedClients);
      return new HttpRemoteFolderSystem(
        // @ts-ignore
        clients.drive,
        clients.newDrive
      );
    })
    .private();

  builder.registerAndUse(SimpleFolderCreator);
  builder.registerAndUse(FolderDeleter);
}
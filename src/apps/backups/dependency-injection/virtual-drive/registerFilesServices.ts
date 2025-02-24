import { ContainerBuilder } from 'diod';
import { SimpleFileOverrider } from '../../../../context/virtual-drive/files/application/override/SimpleFileOverrider';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { HttpRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';
import { Storage } from '@internxt/sdk/dist/drive/storage';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/delete/FileDeleter';
import { SimpleFileCreator } from '../../../../context/virtual-drive/files/application/create/SimpleFileCreator';

export async function registerFilesServices(builder: ContainerBuilder) {
  // Infra
  const user = DependencyInjectionUserProvider.get();

  builder
    .register(HttpRemoteFileSystem)
    .useFactory((c) => new HttpRemoteFileSystem(c.get(Storage), c.get(AuthorizedClients), crypt, user.backupsBucket))
    .private();

  // Services

  builder.registerAndUse(SimpleFileCreator);
  builder.registerAndUse(SimpleFileOverrider);
  builder.registerAndUse(FileDeleter);
}

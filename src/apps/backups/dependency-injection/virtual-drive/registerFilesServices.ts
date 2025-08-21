import { ContainerBuilder } from 'diod';
import { SimpleFileCreator } from '../../../../context/virtual-drive/files/application/create/SimpleFileCreator';
import { FileDeleter } from '../../../../context/virtual-drive/files/application/delete/FileDeleter';
import { SimpleFileOverrider } from '../../../../context/virtual-drive/files/application/override/SimpleFileOverrider';
import { RemoteFileSystem } from '../../../../context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { SDKRemoteFileSystem } from '../../../../context/virtual-drive/files/infrastructure/SDKRemoteFileSystem';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';
import { DependencyInjectionUserProvider } from '../../../shared/dependency-injection/DependencyInjectionUserProvider';

export function registerFilesServices(builder: ContainerBuilder) {
  // Infra
  const user = DependencyInjectionUserProvider.get();

  builder
    .register(RemoteFileSystem)
    .useFactory(
      (c) =>
        new SDKRemoteFileSystem(
          c.get(AuthorizedClients),
          crypt,
          user.backupsBucket
        )
    )
    .private();

  builder.registerAndUse(SimpleFileCreator);
  builder.registerAndUse(FileDeleter);
  builder.registerAndUse(SimpleFileOverrider);
}

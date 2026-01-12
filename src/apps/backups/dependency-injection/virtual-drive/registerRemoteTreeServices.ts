import { ContainerBuilder } from 'diod';
import { RemoteTreeBuilder } from '../../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { Traverser } from '../../../../context/virtual-drive/remoteTree/application/Traverser';
import { RemoteItemsGenerator } from '../../../../context/virtual-drive/remoteTree/domain/RemoteItemsGenerator';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { SQLiteRemoteItemsGenerator } from '../../../../context/virtual-drive/remoteTree/infrastructure/SQLiteRemoteItemsGenerator';

export function registerRemoteTreeServices(builder: ContainerBuilder) {
  // Infra
  builder
    .register(RemoteItemsGenerator)
    .useFactory(() => new SQLiteRemoteItemsGenerator())
    .private();

  builder
    .register(Traverser)
    .useFactory(() => {
      return Traverser.existingItems(crypt);
    })
    .asSingleton()
    .private();

  // Services
  builder.registerAndUse(RemoteTreeBuilder);
}

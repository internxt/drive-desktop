import { ContainerBuilder } from 'diod';
import { RemoteTreeBuilder } from '../../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { Traverser } from '../../../../context/virtual-drive/remoteTree/application/Traverser';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { ipcRendererSyncEngine } from '../../../sync-engine/ipcRendererSyncEngine';
import { RemoteItemsGenerator } from '../../../../context/virtual-drive/items/application/RemoteItemsGenerator';

export async function registerRemoteTreeServices(builder: ContainerBuilder) {
  // Infra
  builder
    .register(RemoteItemsGenerator)
    .useFactory(() => new RemoteItemsGenerator(ipcRendererSyncEngine))
    .private();

  builder
    .register(Traverser)
    .useFactory(() => {
      return Traverser.existingItems(crypt);
    })
    .asSingleton()
    .private();

  // Services
  builder
    .register(RemoteTreeBuilder)
    .useFactory((container) => new RemoteTreeBuilder(container.get(RemoteItemsGenerator), container.get(Traverser)))
    .private();
}

import { ContainerBuilder } from 'diod';
import { RemoteTreeBuilder } from '../../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { Traverser } from '../../../../context/virtual-drive/remoteTree/application/Traverser';
import { RemoteItemsGenerator as RIG } from '../../../../context/virtual-drive/remoteTree/domain/RemoteItemsGenerator';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { ipcRendererSyncEngine } from '../../../sync-engine/ipcRendererSyncEngine';
import { RemoteItemsGenerator } from '@/context/virtual-drive/items/application/RemoteItemsGenerator';

export async function registerRemoteTreeServices(builder: ContainerBuilder) {
  // Infra
  builder
    .register(RIG)
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
  builder.registerAndUse(RemoteTreeBuilder);
}

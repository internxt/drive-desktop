import { ContainerBuilder } from 'diod';
import { RemoteTreeBuilder } from '../../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { Traverser } from '../../../../context/virtual-drive/remoteTree/application/Traverser';
import { IpcRemoteItemsGenerator } from '../../../../context/virtual-drive/remoteTree/infrastructure/IpcRemoteItemsGenerator';
import crypt from '../../../../context/shared/infrastructure/crypt';
import { ipcRendererSyncEngine } from '../../../sync-engine/ipcRendererSyncEngine';

export async function registerRemoteTreeServices(builder: ContainerBuilder) {
  // Infra
  builder
    .register(IpcRemoteItemsGenerator)
    .useFactory(() => new IpcRemoteItemsGenerator(ipcRendererSyncEngine))
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

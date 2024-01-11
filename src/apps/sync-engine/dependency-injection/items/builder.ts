import { RemoteItemsGenerator } from '../../../../context/virtual-drive/items/application/RemoteItemsGenerator';
import { Traverser } from '../../../../context/virtual-drive/items/application/Traverser';
import { TreeBuilder } from '../../../../context/virtual-drive/items/application/TreeBuilder';
import { CryptoJsNameDecrypt } from '../../../../context/virtual-drive/items/infrastructure/CryptoJsNameDecrypt';
import { getUser } from '../../../main/auth/service';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { ItemsContainer } from './ItemsContainer';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new RemoteItemsGenerator(ipcRendererSyncEngine);

  const nameDecryptor = new CryptoJsNameDecrypt();

  const existingItemsTraverser = Traverser.existingItems(
    nameDecryptor,
    ipcRendererSyncEngine,
    user.root_folder_id
  );
  const allStatusesTraverser = Traverser.allItems(
    nameDecryptor,
    ipcRendererSyncEngine,
    user.root_folder_id
  );
  const treeBuilder = new TreeBuilder(
    remoteItemsGenerator,
    existingItemsTraverser
  );

  const allStatusesTreeBuilder = new TreeBuilder(
    remoteItemsGenerator,
    allStatusesTraverser
  );

  return {
    existingItemsTreeBuilder: treeBuilder,
    allStatusesTreeBuilder,
  };
}

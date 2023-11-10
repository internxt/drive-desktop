import { ItemsContainer } from './ItemsContainer';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { getUser } from 'apps/main/auth/service';
import { Traverser } from 'context/virtual-drive/items/application/Traverser';
import { CryptoJsNameDecrypt } from 'context/virtual-drive/items/infrastructure/CryptoJsNameDecrypt';
import { RemoteItemsGenerator } from 'context/virtual-drive/items/application/RemoteItemsGenerator';
import { TreeBuilder } from 'context/virtual-drive/items/application/TreeBuilder';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new RemoteItemsGenerator(ipcRendererSyncEngine);

  const nameDecryptor = new CryptoJsNameDecrypt();

  const existingItemsTraverser = Traverser.existingItems(
    nameDecryptor,
    user.root_folder_id
  );
  const allStatusesTraverser = Traverser.allItems(
    nameDecryptor,
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

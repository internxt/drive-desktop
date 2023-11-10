import { TreeBuilder } from '../../modules/items/application/TreeBuilder';
import { ItemsContainer } from './ItemsContainer';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { RemoteItemsGenerator } from '../../modules/items/application/RemoteItemsGenerator';
import { getUser } from '../../../../main/auth/service';
import { Traverser } from 'workers/sync-engine/modules/items/application/Traverser';
import { CryptoJsNameDecrypt } from 'workers/sync-engine/modules/items/infrastructure/CryptoJsNameDecrypt';

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

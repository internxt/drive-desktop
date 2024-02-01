import { IpcRemoteItemsGenerator } from '../../../../context/virtual-drive/tree/infrastructure/IpcRemoteItemsGenerator';
import { Traverser } from '../../../../context/virtual-drive/tree/application/Traverser';
import { TreeBuilder } from '../../../../context/virtual-drive/tree/application/TreeBuilder';
import { CryptoJsNameDecrypt } from '../../../../context/virtual-drive/tree/infrastructure/CryptoJsNameDecrypt';
import { getUser } from '../../../main/auth/service';
import { SyncEngineIPC } from '../../SyncEngineIpc';
import { ItemsContainer } from './ItemsContainer';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new IpcRemoteItemsGenerator(SyncEngineIPC);

  const nameDecrypt = new CryptoJsNameDecrypt();

  const existingItemsTraverser = Traverser.existingItems(
    nameDecrypt,
    user.root_folder_id
  );
  const allStatusesTraverser = Traverser.allItems(
    nameDecrypt,
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

import { Traverser } from '../../../../../context/virtual-drive/tree/application/Traverser';
import { TreeBuilder } from '../../../../../context/virtual-drive/tree/application/TreeBuilder';
import { CryptoJsNameDecrypt } from '../../../../../context/virtual-drive/tree/infrastructure/CryptoJsNameDecrypt';
import { SQLiteRemoteItemsGenerator } from '../../../../../context/virtual-drive/tree/infrastructure/SQLiteRemoteItemsGenerator';
import { getUser } from '../../../../main/auth/service';
import { TreeContainer } from './TreeContainer';

export function buildTreeContainer(): TreeContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new SQLiteRemoteItemsGenerator();

  const nameDecryptor = new CryptoJsNameDecrypt();

  const existingItemsTraverser = Traverser.existingItems(
    nameDecryptor,
    user.root_folder_id
  );

  const existingNodesTreeBuilder = new TreeBuilder(
    remoteItemsGenerator,
    existingItemsTraverser
  );

  return {
    existingNodesTreeBuilder,
  };
}

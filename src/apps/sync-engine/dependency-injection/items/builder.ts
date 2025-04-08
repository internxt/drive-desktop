import { RemoteItemsGenerator } from '../../../../context/virtual-drive/items/application/RemoteItemsGenerator';
import { Traverser } from '../../../../context/virtual-drive/items/application/Traverser';
import { TreeBuilder } from '../../../../context/virtual-drive/items/application/TreeBuilder';
import { CryptoJsNameDecrypt } from '../../../../context/virtual-drive/items/infrastructure/CryptoJsNameDecrypt';
import { getUser } from '../../../main/auth/service';
import { getConfig } from '../../config';
import { ItemsContainer } from './ItemsContainer';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new RemoteItemsGenerator();

  const nameDecryptor = new CryptoJsNameDecrypt();

  const existingItemsTraverser = new Traverser(nameDecryptor, user.root_folder_id, getConfig().rootUuid);

  const treeBuilder = new TreeBuilder(remoteItemsGenerator, existingItemsTraverser);

  return { treeBuilder };
}

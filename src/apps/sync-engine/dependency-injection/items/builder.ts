import { RemoteItemsGenerator } from '../../../../context/virtual-drive/items/application/RemoteItemsGenerator';
import { Traverser } from '../../../../context/virtual-drive/items/application/Traverser';
import { getUser } from '../../../main/auth/service';
import { getConfig } from '../../config';
import { ItemsContainer } from './ItemsContainer';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new RemoteItemsGenerator();

  const traverser = new Traverser(user.root_folder_id, getConfig().rootUuid, remoteItemsGenerator);

  return { traverser };
}

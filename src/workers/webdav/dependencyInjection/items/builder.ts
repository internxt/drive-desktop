import { TreeBuilder } from '../../modules/items/application/TreeBuilder';
import { ItemsContainer } from './ItemsContainer';
import { ipc } from '../../ipc';
import { RemoteItemsGenerator } from '../../modules/items/application/RemoteItemsGenerator';
import { Traverser } from 'workers/webdav/modules/items/application/Traverser';
import { getUser } from '../../../../main/auth/service';
import crypt from '../../../utils/crypt';

export function build(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new RemoteItemsGenerator(ipc);

  const traverser = new Traverser(crypt, user.root_folder_id);

  const treeBuilder = new TreeBuilder(remoteItemsGenerator, traverser);

  return {
    treeBuilder,
  };
}

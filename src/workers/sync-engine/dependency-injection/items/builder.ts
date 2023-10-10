import { TreeBuilder } from '../../modules/items/application/TreeBuilder';
import { ItemsContainer } from './ItemsContainer';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { RemoteItemsGenerator } from '../../modules/items/application/RemoteItemsGenerator';
import { getUser } from '../../../../main/auth/service';
import crypt from '../../../utils/crypt';
import { ExistingItemsTraverser } from 'workers/sync-engine/modules/items/application/ExistingItemsTraverser';
import { AllStatusesTraverser } from 'workers/sync-engine/modules/items/application/AllStatusesTraverser';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const remoteItemsGenerator = new RemoteItemsGenerator(ipcRendererSyncEngine);

  const existingItemsTraverser = new ExistingItemsTraverser(
    crypt,
    user.root_folder_id
  );

  const treeBuilder = new TreeBuilder(
    remoteItemsGenerator,
    existingItemsTraverser
  );

  const allStatusesTraverser = new AllStatusesTraverser(
    crypt,
    user.root_folder_id
  );

  const allStatusesTreeBuilder = new TreeBuilder(
    remoteItemsGenerator,
    allStatusesTraverser
  );

  return {
    treeBuilder,
    allStatusesTreeBuilder,
  };
}

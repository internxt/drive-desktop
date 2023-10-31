import { ItemsContainer } from './ItemsContainer';
import { ipcRendererSyncEngine } from '../../ipcRendererSyncEngine';
import { IpcRemoteItemsRepository } from '../../modules/items/infrastructure/IpcRemoteItemsRepository';
import { getUser } from '../../../../main/auth/service';
import crypt from '../../../utils/crypt';
import { ExistingItemsTraverser } from 'workers/sync-engine/modules/items/application/ExistingItemsTraverser';
import { AllStatusesTraverser } from 'workers/sync-engine/modules/items/application/AllStatusesTraverser';

export function buildItemsContainer(): ItemsContainer {
  const user = getUser();

  if (!user) {
    throw new Error('Could not get user when building Items dependencies');
  }

  const ipcRemoteItemsRepository = new IpcRemoteItemsRepository(
    ipcRendererSyncEngine
  );

  const existingItemsTraverser = new ExistingItemsTraverser(
    crypt,
    user.root_folder_id,
    ipcRemoteItemsRepository
  );

  const allStatusesTraverser = new AllStatusesTraverser(
    crypt,
    user.root_folder_id,
    ipcRemoteItemsRepository
  );

  return {
    existingItemsTraverser,
    allStatusesTraverser,
  };
}

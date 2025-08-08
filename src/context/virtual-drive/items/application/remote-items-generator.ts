import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export function getAllItems() {
  return ipcRendererSyncEngine.invoke('GET_UPDATED_REMOTE_ITEMS', getConfig().workspaceId);
}

export function getExistingFiles() {
  return ipcRendererSyncEngine.invoke('FIND_EXISTING_FILES');
}

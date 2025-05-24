import { getConfig } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export function getAllItems() {
  return ipcRendererSyncEngine.invoke('GET_UPDATED_REMOTE_ITEMS', getConfig().workspaceId);
}

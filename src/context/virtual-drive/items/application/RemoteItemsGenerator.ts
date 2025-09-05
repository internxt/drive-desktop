import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export function getAllItems({ ctx }: { ctx: ProcessSyncContext }) {
  return ipcRendererSyncEngine.invoke('GET_UPDATED_REMOTE_ITEMS', ctx.workspaceId);
}

export function getExistingFiles({ ctx }: { ctx: ProcessSyncContext }) {
  return ipcRendererSyncEngine.invoke('FIND_EXISTING_FILES', ctx.workspaceId);
}

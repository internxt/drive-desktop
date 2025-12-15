import { SyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export function getExistingFiles({ ctx }: { ctx: SyncContext }) {
  return ipcRendererSyncEngine.invoke('FIND_EXISTING_FILES', {
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
  });
}

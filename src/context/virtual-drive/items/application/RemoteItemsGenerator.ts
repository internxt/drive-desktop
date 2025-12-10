import { SyncContext } from '@/apps/sync-engine/config';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function getAllItems({ ctx }: { ctx: SyncContext }) {
  const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
    SqliteModule.FileModule.getByWorkspaceId({ ...ctx }),
    SqliteModule.FolderModule.getByWorkspaceId({ ...ctx }),
  ]);

  return { files, folders };
}

export function getExistingFiles({ ctx }: { ctx: SyncContext }) {
  return ipcRendererSyncEngine.invoke('FIND_EXISTING_FILES', {
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
  });
}

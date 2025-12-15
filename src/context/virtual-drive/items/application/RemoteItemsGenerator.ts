import { SyncContext } from '@/apps/sync-engine/config';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function getExistingFiles({ ctx }: { ctx: SyncContext }) {
  const { data: files = [] } = await SqliteModule.FileModule.getByWorkspaceId({ ...ctx });
  return files;
}

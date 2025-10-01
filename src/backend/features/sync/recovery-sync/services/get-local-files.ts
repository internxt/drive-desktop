import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = {
  ctx: SyncContext;
  first: FileDto;
  last: FileDto;
};

export async function getLocalFiles({ ctx, first, last }: Props) {
  await Promise.all([createOrUpdateFile({ context: ctx, fileDto: first }), createOrUpdateFile({ context: ctx, fileDto: last })]);

  const { data: locals } = await SqliteModule.FileModule.getByStatus({
    workspaceId: ctx.workspaceId,
    status: 'EXISTS',
  });

  if (!locals) return;

  const start = locals.findIndex((local) => local.uuid === first.uuid);
  const end = locals.findIndex((local) => local.uuid === last.uuid);

  return locals.slice(start, end + 1);
}

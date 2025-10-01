import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function getLocalFiles({ ctx, remotes }: { ctx: SyncContext; remotes: FileDto[] }) {
  remotes.sort((a, b) => a.id - b.id);

  const first = remotes.at(0);
  const last = remotes.at(-1);

  if (!first || !last) return;

  await Promise.all([createOrUpdateFile({ context: ctx, fileDto: first }), createOrUpdateFile({ context: ctx, fileDto: last })]);

  const { data: locals } = await SqliteModule.FileModule.getBetweenIds({
    workspaceId: ctx.workspaceId,
    firstId: first.id,
    lastId: last.id,
  });

  if (!locals) return;

  ctx.logger.debug({
    msg: 'Files recovery sync',
    remotes: remotes.length,
    locals: locals.length,
    first: { id: first.id, name: first.plainName },
    last: { id: last.id, name: last.plainName },
  });

  return locals;
}

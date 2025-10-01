import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export function sortItems<T extends FileDto | SimpleDriveFile>({ items }: { items: T[] }) {
  return items.sort((a, b) => {
    const dateCompare = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.name.localeCompare(b.name);
  });
}

export async function getLocalFiles({ ctx, remotes }: { ctx: SyncContext; remotes: FileDto[] }) {
  const sortedRemotes = sortItems({ items: remotes });

  const first = sortedRemotes.at(0);
  const last = sortedRemotes.at(-1);

  if (!first || !last) return;

  await Promise.all([createOrUpdateFile({ context: ctx, fileDto: first }), createOrUpdateFile({ context: ctx, fileDto: last })]);

  const { data: allLocals } = await SqliteModule.FileModule.getByStatus({
    workspaceId: ctx.workspaceId,
    status: 'EXISTS',
  });

  if (!allLocals) return;

  const sortedLocals = sortItems({ items: allLocals });

  const start = sortedLocals.findIndex((local) => local.uuid === first.uuid);
  const end = sortedLocals.findIndex((local) => local.uuid === last.uuid);

  const locals = sortedLocals.slice(start, end + 1);

  ctx.logger.debug({
    msg: 'Files recovery sync',
    remotes: remotes.length,
    locals: locals.length,
    first: { uuid: first.uuid, name: first.plainName, updatedAt: first.updatedAt },
    last: { uuid: last.uuid, name: last.plainName, updatedAt: last.updatedAt },
  });

  return locals;
}

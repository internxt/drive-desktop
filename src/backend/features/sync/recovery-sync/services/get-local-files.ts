import { SyncContext } from '@/apps/sync-engine/config';
import { ParsedFileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function getLocalFiles({ ctx, remotes }: { ctx: SyncContext; remotes: ParsedFileDto[] }) {
  const first = remotes.at(0);
  const last = remotes.at(-1);

  if (!first || !last) return;

  const { data: locals } = await SqliteModule.FileModule.getBetweenUuids({
    workspaceId: ctx.workspaceId,
    firstUuid: first.uuid,
    lastUuid: last.uuid,
  });

  if (!locals) return;

  ctx.logger.debug({
    msg: 'Files recovery sync',
    remotes: remotes.length,
    locals: locals.length,
    first: { uuid: first.uuid, name: first.plainName },
    last: { uuid: last.uuid, name: last.plainName },
  });

  return locals;
}

import { SyncContext } from '@/apps/sync-engine/config';
import { ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = { ctx: SyncContext; remotes: ParsedFolderDto[] };

export async function getLocalFolders({ ctx, remotes }: Props) {
  const first = remotes.at(0);
  const last = remotes.at(-1);

  if (!first || !last) return;

  const { data: locals } = await SqliteModule.FolderModule.getBetweenUuids({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    firstUuid: first.uuid,
    lastUuid: last.uuid,
  });

  if (!locals) return;

  ctx.logger.debug({
    msg: 'Folders recovery sync',
    remotes: remotes.length,
    locals: locals.length,
    first: { uuid: first.uuid, name: first.plainName },
    last: { uuid: last.uuid, name: last.plainName },
  });

  return locals;
}

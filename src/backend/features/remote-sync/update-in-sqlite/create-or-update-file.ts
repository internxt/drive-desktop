import { BackupsContext } from '@/apps/backups/BackupInfo';
import { SyncContext } from '@/apps/sync-engine/config';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type TProps = {
  context: SyncContext | BackupsContext;
  fileDto: FileDto;
};

export async function createOrUpdateFile({ context, fileDto }: TProps) {
  return await SqliteModule.FileModule.createOrUpdate({
    file: {
      ...fileDto,
      size: Number(fileDto.size),
      isDangledStatus: false,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    },
  });
}

import { BackupsContext } from '@/apps/backups/BackupInfo';
import { SyncContext } from '@/apps/sync-engine/config';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function createOrUpdateFile({ context, fileDto }: { context: SyncContext | BackupsContext; fileDto: FileDto }) {
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

export async function createOrUpdateFiles({ context, fileDtos }: { context: SyncContext; fileDtos: FileDto[] }) {
  return await SqliteModule.FileModule.createOrUpdateBatch({
    files: fileDtos.map((fileDto) => ({
      ...fileDto,
      size: Number(fileDto.size),
      isDangledStatus: false,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    })),
  });
}

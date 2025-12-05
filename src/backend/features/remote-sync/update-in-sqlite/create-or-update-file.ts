import { CommonContext } from '@/apps/sync-engine/config';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function createOrUpdateFile({ ctx, fileDto }: { ctx: CommonContext; fileDto: FileDto }) {
  return await SqliteModule.FileModule.createOrUpdate({
    file: {
      ...fileDto,
      size: Number(fileDto.size),
      isDangledStatus: false,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
    },
  });
}

export async function createOrUpdateFiles({ ctx, fileDtos }: { ctx: CommonContext; fileDtos: FileDto[] }) {
  return await SqliteModule.FileModule.createOrUpdateBatch({
    files: fileDtos.map((fileDto) => ({
      ...fileDto,
      size: Number(fileDto.size),
      isDangledStatus: false,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
    })),
  });
}

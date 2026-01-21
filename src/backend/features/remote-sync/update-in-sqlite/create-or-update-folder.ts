import { CommonContext } from '@/apps/sync-engine/config';
import { ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function createOrUpdateFolder({ ctx, folderDto }: { ctx: CommonContext; folderDto: ParsedFolderDto }) {
  return await SqliteModule.FolderModule.createOrUpdate({
    folder: {
      ...folderDto,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
    },
  });
}

export async function createOrUpdateFolders({ ctx, folderDtos }: { ctx: CommonContext; folderDtos: ParsedFolderDto[] }) {
  return await SqliteModule.FolderModule.createOrUpdateBatch({
    folders: folderDtos.map((folderDto) => ({
      ...folderDto,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
    })),
  });
}

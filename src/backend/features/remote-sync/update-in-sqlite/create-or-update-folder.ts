import { CommonContext } from '@/apps/sync-engine/config';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function createOrUpdateFolder({ ctx, folderDto }: { ctx: CommonContext; folderDto: FolderDto }) {
  return await SqliteModule.FolderModule.createOrUpdate({
    folder: {
      ...folderDto,
      userUuid: ctx.userUuid,
      workspaceId: ctx.workspaceId,
    },
  });
}

export async function createOrUpdateFolders({ context, folderDtos }: { context: CommonContext; folderDtos: FolderDto[] }) {
  return await SqliteModule.FolderModule.createOrUpdateBatch({
    folders: folderDtos.map((folderDto) => ({
      ...folderDto,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    })),
  });
}

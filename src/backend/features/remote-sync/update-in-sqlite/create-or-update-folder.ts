import { Config } from '@/apps/sync-engine/config';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function createOrUpdateFolder({ context, folderDto }: { context: Config; folderDto: FolderDto }) {
  return await SqliteModule.FolderModule.createOrUpdate({
    folder: {
      ...folderDto,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    },
  });
}

export async function createOrUpdateFolders({ context, folderDtos }: { context: Config; folderDtos: FolderDto[] }) {
  return await SqliteModule.FolderModule.createOrUpdateBatch({
    folders: folderDtos.map((folderDto) => ({
      ...folderDto,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    })),
  });
}

import { Config } from '@/apps/sync-engine/config';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export async function createOrUpdateFolders({ context, folderDtos }: { context: Config; folderDtos: FolderDto[] }) {
  return await SqliteModule.FolderModule.createOrUpdateBatch({
    folders: folderDtos.map((folderDto) => ({
      ...folderDto,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    })),
  });
}

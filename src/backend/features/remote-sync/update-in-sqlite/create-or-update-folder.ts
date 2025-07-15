import { Config } from '@/apps/sync-engine/config';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type TProps = {
  context: Config;
  folderDto: FolderDto;
};

export async function createOrUpdateFolder({ context, folderDto }: TProps) {
  return await SqliteModule.FolderModule.createOrUpdate({
    folder: {
      ...folderDto,
      userUuid: context.userUuid,
      workspaceId: context.workspaceId,
    },
  });
}

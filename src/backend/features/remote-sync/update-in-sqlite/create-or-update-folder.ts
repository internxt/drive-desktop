import { driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { Config } from '@/apps/sync-engine/config';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';

type TProps = {
  context: Config;
  folderDto: FolderDto;
};

export async function createOrUpdateFolder({ context, folderDto }: TProps) {
  return await driveFoldersCollection.createOrUpdate({
    ...folderDto,
    userUuid: context.userUuid,
    workspaceId: context.workspaceId,
  });
}

import { driveFilesCollection } from '@/apps/main/remote-sync/store';
import { Config } from '@/apps/sync-engine/config';
import { FileDto } from '@/infra/drive-server-wip/out/dto';

type TProps = {
  context: Config;
  fileDto: FileDto;
};

export async function createOrUpdateFile({ context, fileDto }: TProps) {
  return await driveFilesCollection.createOrUpdate({
    ...fileDto,
    size: Number(fileDto.size),
    isDangledStatus: false,
    userUuid: context.userUuid,
    workspaceId: context.workspaceId,
  });
}

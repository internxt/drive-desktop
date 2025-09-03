import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFile } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

type TProps = {
  self: RemoteSyncManager;
  remoteFile: FileDto;
};

export async function syncRemoteFile({ self, remoteFile }: TProps) {
  const { error } = await createOrUpdateFile({ context: self.context, fileDto: remoteFile });

  if (error) {
    logger.error({
      msg: 'Error creating remote file in sqlite',
      workspaceId: self.workspaceId,
      uuid: remoteFile.uuid,
      error,
    });
  }
}

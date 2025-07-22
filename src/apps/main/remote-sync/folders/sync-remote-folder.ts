import { RemoteSyncManager } from '../RemoteSyncManager';
import { logger } from '@/apps/shared/logger/logger';
import { FolderDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFolder } from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';

type TProps = {
  self: RemoteSyncManager;
  remoteFolder: FolderDto;
};

export async function syncRemoteFolder({ self, remoteFolder }: TProps) {
  const { error } = await createOrUpdateFolder({ context: self.context, folderDto: remoteFolder });

  if (error) {
    logger.error({
      msg: 'Error creating remote folder in sqlite',
      workspaceId: self.workspaceId,
      uuid: remoteFolder.uuid,
      error,
    });
  }
}

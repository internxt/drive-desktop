import { User } from '../../types';
import { RemoteSyncedFile } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { driveFilesCollection } from '../store';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: RemoteSyncManager;
  user: User;
  remoteFile: RemoteSyncedFile;
};

export async function syncRemoteFile({ self, user, remoteFile }: TProps) {
  try {
    await driveFilesCollection.createOrUpdate({
      ...remoteFile,
      isDangledStatus: false,
      userUuid: user.uuid,
      workspaceId: self.workspaceId,
    });

    self.totalFilesSynced++;
  } catch (exc) {
    logger.error({
      msg: 'Error creating remote file in sqlite',
      workspaceId: self.workspaceId,
      uuid: remoteFile.uuid,
      exc,
    });
  }
}

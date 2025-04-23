import { Folder, FolderAttributesWithoutPath } from '@/context/virtual-drive/folders/domain/Folder';
import { User } from '../../types';
import { RemoteSyncedFolder } from '../helpers';
import { RemoteSyncManager } from '../RemoteSyncManager';
import { driveFoldersCollection } from '../store';
import { logger } from '@/apps/shared/logger/logger';

type TProps = {
  self: RemoteSyncManager;
  user: User;
  remoteFolder: RemoteSyncedFolder;
};

export async function syncRemoteFolder({ self, user, remoteFolder }: TProps) {
  try {
    await driveFoldersCollection.createOrUpdate({
      ...remoteFolder,
      userUuid: user.uuid,
      workspaceId: self.workspaceId,
    });

    self.totalFoldersSynced++;
  } catch (exc) {
    logger.error({
      msg: 'Error creating remote folder in sqlite',
      workspaceId: self.workspaceId,
      uuid: remoteFolder.uuid,
      exc,
    });
  }
}

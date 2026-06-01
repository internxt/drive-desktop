import { RemoteTreeBuilder } from '../../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { RemoteItemsGenerator } from '../../../../context/virtual-drive/remoteTree/domain/RemoteItemsGenerator';
import { FolderRepositorySynchronizer } from '../../../../context/virtual-drive/folders/application/FolderRepositorySynchronizer/FolderRepositorySynchronizer';
import { FileRepositorySynchronizer } from '../../../../context/virtual-drive/files/application/FileRepositorySynchronizer';
import { StorageRemoteChangesSyncher } from '../../../../context/storage/StorageFiles/application/sync/StorageRemoteChangesSyncher';
import { ServerFolderStatus } from '../../../../context/shared/domain/ServerFolder';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { User } from '../../../../apps/main/types';
import { Container } from 'diod';

// This is the old src/apps/drive/fuse/FuseApp.update
export async function updateVirtualDriveContainer({ container, user }: { container: Container; user: User }) {
  try {
    const [tree, allRemoteItems] = await Promise.all([
      container.get(RemoteTreeBuilder).run(user.root_folder_id, user.rootFolderId),
      container.get(RemoteItemsGenerator).getAll(),
    ]);

    const deletedFolderIds = new Set(
      allRemoteItems.folders.filter((f) => f.status !== ServerFolderStatus.EXISTS).map((f) => f.id),
    );

    await Promise.all([
      container.get(FileRepositorySynchronizer).run(tree.files),
      container.get(FolderRepositorySynchronizer).run(tree.folders, deletedFolderIds),
      container.get(StorageRemoteChangesSyncher).run(),
    ]);
    logger.debug({ msg: '[VIRTUAL DRIVE] Tree updated successfully' });
    return { data: true };
  } catch (err) {
    logger.error({ msg: '[VIRTUAL DRIVE] Error updating tree', error: err });
    return { data: false };
  }
}

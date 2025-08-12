import { logger } from '@internxt/drive-desktop-core/build/backend';
import { virtualDrive } from '../dependency-injection/common/virtualDrive';
import { getPendingItems } from './get-pending-items';
import { addPendingFiles } from './add-pending-files';
import { addPendingFolders } from './add-pending-folders';
import { IControllers } from '../callbacks-controllers/buildControllers';
import { getConfig } from '../config';
import { syncModifiedFiles } from './sync-modified-files';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import { Tree } from '@/context/virtual-drive/items/application/Traverser';

type Props = {
  controllers: IControllers;
  fileContentsUploader: ContentsUploader;
  tree: Tree;
};

export async function addPendingItems({ controllers, fileContentsUploader, tree }: Props) {
  try {
    const { pendingFiles, pendingFolders } = await getPendingItems({
      virtualDrive,
      path: virtualDrive.syncRootPath,
    });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Pending items',
      workspaceId: getConfig().workspaceId,
      pendingFiles: pendingFiles.length,
      pendingFolders: pendingFolders.length,
    });

    await Promise.all([addPendingFiles({ pendingFiles, controllers }), addPendingFolders({ pendingFolders, controllers })]);
    await syncModifiedFiles({ fileContentsUploader, virtualDrive, tree });
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error adding pending items',
      exc,
    });
  }
}

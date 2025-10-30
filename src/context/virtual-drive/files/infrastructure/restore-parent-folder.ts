import { NodeWin } from '@/infra/node-win/node-win.module';
import path from 'node:path';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@/apps/shared/logger/logger';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  ctx: ProcessSyncContext;
  offline: { contentsId: string; path: RelativePath; size: number; folderUuid: string };
};

export async function restoreParentFolder({ ctx, offline }: TProps) {
  const posixDir = pathUtils.dirname(offline.path);
  const targetFolderName = path.posix.basename(posixDir);
  const grandParentFolder = pathUtils.dirname(posixDir);

  const { data: parentFolderInfo } = NodeWin.getFolderInfo({ ctx, path: grandParentFolder });

  if (!parentFolderInfo) {
    throw logger.error({ msg: 'Could not restore parent folder, parentUuid not found', path: offline.path });
  }

  const { error } = await driveServerWip.folders.move({
    parentUuid: parentFolderInfo.uuid,
    name: targetFolderName,
    workspaceToken: ctx.workspaceToken,
    uuid: offline.folderUuid,
  });

  if (error && error.code !== 'FOLDER_ALREADY_EXISTS') {
    throw logger.error({
      msg: 'Error restoring parent folder',
      path: offline.path,
      error,
    });
  }
}

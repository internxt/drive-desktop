import { NodeWin } from '@/infra/node-win/node-win.module';
import { basename } from 'node:path';
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
  const targetFolderName = basename(posixDir);
  const grandParentFolder = pathUtils.dirname(posixDir);

  const { data: parentInfo } = NodeWin.getFolderInfo({ ctx, path: grandParentFolder });

  if (!parentInfo) {
    throw logger.error({ msg: 'Could not restore parent folder, parentUuid not found', path: offline.path });
  }

  const { error } = await driveServerWip.folders.move({
    parentUuid: parentInfo.uuid,
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

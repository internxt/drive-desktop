import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';

type TProps = {
  ctx: ProcessSyncContext;
  remotePath: AbsolutePath;
  localPath: AbsolutePath;
};

export function hasToBeMoved({ ctx, remotePath, localPath }: TProps) {
  if (remotePath === localPath) return false;

  const remoteParentPath = dirname(remotePath);
  const localParentPath = dirname(localPath);

  const isRenamed = remoteParentPath === localParentPath;
  if (isRenamed) return true;

  const { data: remoteParentInfo } = NodeWin.getFolderInfo({ ctx, path: remoteParentPath });
  const { data: localParentInfo } = NodeWin.getFolderInfo({ ctx, path: localParentPath });

  if (!remoteParentInfo || !localParentInfo) return false;

  const isMoved = remoteParentInfo.uuid !== localParentInfo.uuid;
  return isMoved;
}

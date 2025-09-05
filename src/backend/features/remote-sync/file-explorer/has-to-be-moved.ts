import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { dirname } from 'path';

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

  const { data: remoteParentUuid } = NodeWin.getFolderUuid({ ctx, path: remoteParentPath });
  const { data: localParentUuid } = NodeWin.getFolderUuid({ ctx, path: localParentPath });

  if (!remoteParentUuid || !localParentUuid) return false;

  const isMoved = remoteParentUuid !== localParentUuid;
  return isMoved;
}

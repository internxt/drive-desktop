import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';

type TProps = {
  ctx: SyncContext;
  remotePath: AbsolutePath;
  localPath: AbsolutePath;
};

export function hasToBeMoved({ remotePath, localPath }: TProps) {
  if (remotePath === localPath) return false;

  let remoteParentPath = dirname(remotePath);
  let localParentPath = dirname(localPath);

  const isRenamed = remoteParentPath === localParentPath;
  if (isRenamed) return true;

  remoteParentPath = dirname(remoteParentPath);
  localParentPath = dirname(localParentPath);

  const isMoved = remoteParentPath === localParentPath;
  return isMoved;
}

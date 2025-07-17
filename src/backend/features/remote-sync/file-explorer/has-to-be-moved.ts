import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { dirname } from 'path';

type TProps = {
  drive: VirtualDrive;
  remotePath: AbsolutePath;
  localPath: AbsolutePath;
};

export function hasToBeMoved({ drive, remotePath, localPath }: TProps) {
  if (remotePath === localPath) return false;

  const remoteParentPath = dirname(remotePath);
  const localParentPath = dirname(localPath);

  const isRenamed = remoteParentPath === localParentPath;
  if (isRenamed) return true;

  const { data: remoteParentUuid } = NodeWin.getFolderUuid({ drive, path: remoteParentPath });
  const { data: localParentUuid } = NodeWin.getFolderUuid({ drive, path: localParentPath });

  if (!remoteParentUuid || !localParentUuid) return false;

  const isMoved = remoteParentUuid !== localParentUuid;
  return isMoved;
}

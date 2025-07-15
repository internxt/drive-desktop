import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { dirname } from 'path';

type TProps = {
  remotePath: AbsolutePath;
  localPath: AbsolutePath;
};

export function hasToBeMoved({ remotePath, localPath }: TProps) {
  if (remotePath === localPath) return false;

  let remoteParentPath = dirname(remotePath);
  let localParentPath = dirname(localPath);

  // Renamed
  if (remoteParentPath === localParentPath) return true;

  // Moved
  if (remoteParentPath !== localParentPath) {
    remoteParentPath = dirname(remoteParentPath);
    localParentPath = dirname(localParentPath);

    /**
     * v2.5.6 Daniel Jiménez
     * We just want to move if the parent is different but the rest of the path is
     * the same, otherwise it means that this is not the root of the move action
     */
    if (remoteParentPath === localParentPath) return true;
  }

  return false;
}

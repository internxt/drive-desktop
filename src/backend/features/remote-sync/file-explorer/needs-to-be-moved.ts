import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileExplorerItem } from '../sync-items-by-checkpoint/load-in-memory-paths';

type Props = {
  remote: ExtendedDriveFile | ExtendedDriveFolder;
  local: FileExplorerItem;
};

export function needsToBeMoved({ remote, local }: Props) {
  if (remote.absolutePath === local.path) return false;

  const remoteParentPath = dirname(remote.absolutePath);
  const localParentPath = dirname(local.path);

  const isRenamed = remoteParentPath === localParentPath;
  if (isRenamed) return true;

  const isMoved = remote.parentUuid !== local.parentUuid;
  return isMoved;
}

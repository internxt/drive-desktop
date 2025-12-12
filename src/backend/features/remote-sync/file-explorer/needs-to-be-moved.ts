import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';

type TProps = {
  ctx: SyncContext;
  remote: ExtendedDriveFile | ExtendedDriveFolder;
  localPath: AbsolutePath;
};

export async function needsToBeMoved({ ctx, remote, localPath }: TProps) {
  if (remote.absolutePath === localPath) return false;

  const remoteParentPath = dirname(remote.absolutePath);
  const localParentPath = dirname(localPath);

  const isRenamed = remoteParentPath === localParentPath;
  if (isRenamed) return true;

  const { data: localParentInfo } = await NodeWin.getFolderInfo({ ctx, path: localParentPath });

  if (!localParentInfo) return false;

  const isMoved = remote.parentUuid !== localParentInfo.uuid;
  return isMoved;
}

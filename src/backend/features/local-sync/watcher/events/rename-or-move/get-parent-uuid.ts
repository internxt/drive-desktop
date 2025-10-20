import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Watcher } from '@/node-win/watcher/watcher';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  type: 'file' | 'folder';
  path: RelativePath;
  item?: SimpleDriveFile | SimpleDriveFolder;
};

export function getParentUuid({ ctx, self, type, path, item }: TProps) {
  const parentPath = pathUtils.dirname(path);
  const { data: parentUuid, error } = NodeWin.getFolderUuid({ ctx, path: parentPath });

  if (!item || error) {
    self.logger.error({ msg: 'Error moving item', type, path, error });
    return;
  }

  return parentUuid;
}

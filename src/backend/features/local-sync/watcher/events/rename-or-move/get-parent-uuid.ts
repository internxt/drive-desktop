import { getConfig } from '@/apps/sync-engine/config';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Watcher } from '@/node-win/watcher/watcher';

type TProps = {
  self: Watcher;
  path: RelativePath;
  props: Record<string, string>;
  oldName?: string;
  oldParentUuid?: string;
};

export function getParentUuid({ self, path, props, oldName, oldParentUuid }: TProps) {
  const parentPath = pathUtils.dirname(path);
  const { data: parentUuid, error } = NodeWin.getFolderUuid({
    drive: self.virtualDrive,
    rootUuid: getConfig().rootUuid,
    path: parentPath,
  });

  /**
   * v2.5.6 Daniel Jiménez
   * This should never happen. If a file is moved (add event and has a placeholderId),
   * then the parent should has a placeholderId and the file should be in the database.
   * However, this can happen for old items that do not have parentUuid because they are
   * too old and the parentUuid it's not migrated yet in drive-server-wip.
   */
  if (!oldName || !oldParentUuid || error) {
    self.logger.error({ msg: 'Error moving item', ...props, oldName, oldParentUuid, error });
    return;
  }

  return parentUuid;
}

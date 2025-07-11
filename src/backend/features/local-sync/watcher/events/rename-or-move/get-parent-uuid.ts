import { getConfig } from '@/apps/sync-engine/config';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { Watcher } from '@/node-win/watcher/watcher';

type TProps = {
  self: Watcher;
  path: RelativePath;
  props: Record<string, string>;
  item?: {
    oldName: string;
    oldParentUuid: string | undefined;
  };
};

export function getParentUuid({ self, path, props, item }: TProps) {
  const parentPath = pathUtils.dirname(path);
  const { data: parentUuid, error } = NodeWin.getFolderUuid({
    drive: self.virtualDrive,
    rootUuid: getConfig().rootUuid,
    path: parentPath,
  });

  if (!item || error) {
    self.logger.error({ msg: 'Error moving item', ...props, item, error });
    return;
  }

  return { existingItem: item, parentUuid };
}

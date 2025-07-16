import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';

type Props = {
  path: RelativePath;
  virtualDrive: VirtualDrive;
};

export function getParentUuid({ path, virtualDrive }: Props) {
  const parentPath = pathUtils.dirname(path);

  const { data: parentUuid } = NodeWin.getFolderUuid({ drive: virtualDrive, path: parentPath });

  /**
   * v2.5.6 Daniel Jiménez
   * Here we have two possibilities:
   * - if the parent exists it means that we have to mark this item as TRASHED because it's the
   * root of the delete event.
   * - if the parent doesn't exist it means that this item has been deleted because it's inside
   * of a folder that has been deleted and we need to find that folder to mark it as TRASHED.
   */
  return parentUuid;
}

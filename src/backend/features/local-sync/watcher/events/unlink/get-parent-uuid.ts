import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { NodeWin } from '@/infra/node-win/node-win.module';
import VirtualDrive from '@/node-win/virtual-drive';
import { dirname } from 'path';

type Props = {
  absolutePath: AbsolutePath;
  virtualDrive: VirtualDrive;
};

export async function getParentUuid({ absolutePath, virtualDrive }: Props) {
  const parentPath = dirname(absolutePath);
  const { data: parentUuid } = NodeWin.getFolderUuid({ drive: virtualDrive, path: parentPath });
  const { data: stats } = await fileSystem.stat({ absolutePath: parentPath });

  /**
   * v2.5.6 Daniel Jiménez
   * Here we have two possibilities:
   * - if the parent exists it means that we have to mark this item as TRASHED because it's the
   * root of the delete event.
   * - if the parent doesn't exist it means that this item has been deleted because it's inside
   * of a folder that has been deleted and we need to find that folder to mark it as TRASHED.
   *
   * Warning: Using just folderUuid is not going to work. There are some times in which we are
   * getting the parentUuid even when the parent folder is deleted.
   */
  if (parentUuid && stats) return parentUuid;
  return null;
}

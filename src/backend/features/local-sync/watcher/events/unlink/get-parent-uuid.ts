import { sleep } from '@/apps/main/util';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
};

export async function getParentUuid({ ctx, path }: Props) {
  /**
   * v2.5.6 Daniel Jiménez
   * Here we have two possibilities:
   * - if the parent exists it means that we have to mark this item as TRASHED because it's the
   * root of the delete event.
   * - if the parent doesn't exist it means that this item has been deleted because it's inside
   * of a folder that has been deleted and we need to find that folder to mark it as TRASHED.
   *
   * Warning: events from C++ are too fast, so we need to wait before checking the parent folder.
   * Otherwise we are going to get the parent info like if it still exists.
   */
  await sleep(2_000);

  const parentPath = dirname(path);
  const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

  if (parentInfo) return parentInfo.uuid;
  return null;
}

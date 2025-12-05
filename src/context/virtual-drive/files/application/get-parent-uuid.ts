import { SyncContext } from '@/apps/sync-engine/config';
import { dirname } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FolderCreator } from '../../folders/application/FolderCreator';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type Props = {
  path: AbsolutePath;
  ctx: SyncContext;
};

export async function getParentUuid({ ctx, path }: Props): Promise<FolderUuid> {
  const parentPath = dirname(path);
  const { data: parentInfo } = await NodeWin.getFolderInfo({ ctx, path: parentPath });

  if (parentInfo) return parentInfo.uuid;

  return await FolderCreator.run({ ctx, path: parentPath });
}

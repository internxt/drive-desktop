import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { readdir } from 'node:fs/promises';

type Props = {
  ctx: ProcessSyncContext;
  path: RelativePath;
  absolutePath: AbsolutePath;
};

export async function updateFolderStatus({ ctx, path, absolutePath }: Props) {
  const items = await readdir(absolutePath);
  const isEmpty = items.length === 0;
  if (isEmpty) {
    ctx.virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: true, sync: true });
  }
}

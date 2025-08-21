import { virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { readdir } from 'fs/promises';

type Props = {
  path: RelativePath;
  absolutePath: AbsolutePath;
};

export async function updateFolderStatus({ path, absolutePath }: Props) {
  const items = await readdir(absolutePath);
  const isEmpty = items.length === 0;
  if (isEmpty) {
    virtualDrive.updateSyncStatus({ itemPath: path, isDirectory: true, sync: true });
  }
}

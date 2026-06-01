import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../context/shared/domain/Result';
import { safeStat } from '../../../../infra/local-file-system/safe-stat';
import { AbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../../context/local/localTree/domain/LocalTree';
import { traverse } from './traverse';

export async function buildLocalTree(
  folder: AbsolutePath,
): Promise<
  Result<{ tree: LocalTree; skippedItems: Array<{ path: AbsolutePath; error: DriveDesktopError }> }, DriveDesktopError>
> {
  const { data: root, error } = await safeStat(folder);
  if (error) {
    return { error };
  }
  if (!root.isDirectory()) {
    return { error: new DriveDesktopError('BAD_REQUEST', `${folder} is not a directory`) };
  }
  const tree = new LocalTree(folder, root.mtime.getTime());
  const result = await traverse({ tree, currentFolder: folder, rootFolder: folder });
  if (result.error) {
    return { error: result.error };
  }
  return { data: { tree, skippedItems: result.data.skippedItems } };
}

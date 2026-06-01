import { AbsolutePath, createAbsolutePath } from '../../../../context/local/localFile/infrastructure/AbsolutePath';
import { DriveDesktopError } from '../../../../context/shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../context/shared/domain/Result';
import { safeReadDir } from '../../../../infra/local-file-system/safe-readdir';
import { ExtendedDirent, ProcessedDirents } from './types';
import { safeStat } from '../../../../infra/local-file-system/safe-stat';

export async function getDirentsForPath(
  absolutePath: AbsolutePath,
): Promise<Result<ProcessedDirents, DriveDesktopError>> {
  const files: Array<ExtendedDirent> = [];
  const folders: Array<ExtendedDirent> = [];
  const skippedItems: Array<{ path: AbsolutePath; error: DriveDesktopError }> = [];
  const { data: dirents, error } = await safeReadDir(absolutePath);
  if (error) return { error };

  for (const dirent of dirents) {
    const currentPath = createAbsolutePath(absolutePath.toString(), dirent.name);

    if (dirent.isSymbolicLink()) {
      skippedItems.push({
        path: currentPath,
        error: new DriveDesktopError('ACTION_NOT_PERMITTED', 'Symbolic links are skipped'),
      });
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const statResult = await safeStat(currentPath);
    if (statResult.error) {
      skippedItems.push({ path: currentPath, error: statResult.error });
      continue;
    }
    if (statResult.data.isFile()) {
      files.push({ path: currentPath, stats: statResult.data });
      continue;
    }
    if (statResult.data.isDirectory()) {
      folders.push({ path: currentPath, stats: statResult.data });
    }
  }
  return { data: { files, folders, skippedItems } };
}

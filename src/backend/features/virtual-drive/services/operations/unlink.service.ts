import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { TemporalFileDeleter } from '../../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { Result } from '../../../../../context/shared/domain/Result';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FileTrasher } from '../../../../../context/virtual-drive/files/application/trash/FileTrasher';
import { FileStatuses } from '../../../../../context/virtual-drive/files/domain/FileStatus';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';

export async function unlink(path: string, container: Container): Promise<Result<void, FuseError>> {
  const file = await container.get(FirstsFileSearcher).run({
    path,
    status: FileStatuses.EXISTS,
  });

  if (!file) {
    const temporalFile = await container.get(TemporalFileByPathFinder).run(path);

    if (!temporalFile && !TemporalFile.isTemporaryPath(path)) {
      const msg = `[FUSE - Unlink] File not found: ${path}`;
      logger.error({ msg });
      return { error: new FuseError(FuseCodes.ENOENT, msg) };
    }

    if (temporalFile) {
      await container.get(TemporalFileDeleter).run(path);
    }

    return { data: undefined };
  }

  try {
    await container.get(FileTrasher).run(file.contentsId);
    return { data: undefined };
  } catch {
    const msg = `[FUSE - Unlink] Unable to trash file: ${path}`;
    logger.error({ msg });
    return { error: new FuseError(FuseCodes.EIO, msg) };
  }
}

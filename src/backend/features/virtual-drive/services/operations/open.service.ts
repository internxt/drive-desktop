import { Container } from 'diod';
import { Result } from '../../../../../context/shared/domain/Result';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { logger } from '@internxt/drive-desktop-core/build/backend';

export async function open(path: string, processName: string, container: Container): Promise<Result<void, FuseError>> {
  try {
    const virtualFile = await container.get(FirstsFileSearcher).run({ path });

    if (virtualFile) {
      return { data: undefined };
    }

    const temporalFile = await container.get(TemporalFileByPathFinder).run(path);

    if (temporalFile) {
      return { data: undefined };
    }

    const msg = `[FUSE - Open] File not found: ${path}`;
    logger.error({ msg, processName });
    return { error: new FuseError(FuseCodes.ENOENT, msg) };
  } catch (err) {
    if (TemporalFile.isTemporaryPath(path)) {
      const msg = `[FUSE - Open] Auxiliary path conflict: ${path}`;
      return { error: new FuseError(FuseCodes.EEXIST, msg) };
    }

    logger.error({ msg: '[FUSE - Open] Unexpected error', error: err, path });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Open] IO error: ${path}`) };
  }
}

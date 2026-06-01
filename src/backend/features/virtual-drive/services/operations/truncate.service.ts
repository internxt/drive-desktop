import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileTruncater } from '../../../../../context/storage/TemporalFiles/application/truncate/TemporalFileTruncater';
import { FirstsFileSearcher } from '../../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';

type TruncateProps = {
  path: string;
  size: number;
  container: Container;
};

export async function truncate({ path, size, container }: TruncateProps): Promise<Result<void, FuseError>> {
  try {
    const virtualFile = await container.get(FirstsFileSearcher).run({ path });
    const temporalFile = await container.get(TemporalFileByPathFinder).run(path);

    if (!virtualFile && !temporalFile) {
      const msg = `[FUSE - Truncate] File not found: ${path}`;
      return { error: new FuseError(FuseCodes.ENOENT, msg) };
    }

    if (!temporalFile) {
      await container.get(TemporalFileCreator).run(path);
    }

    await container.get(TemporalFileTruncater).run(path, size);
    return { data: undefined };
  } catch (error: unknown) {
    logger.error({ msg: '[FUSE - Truncate] Unable to truncate temporal file', error, path, size });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Truncate] IO error: ${path}`) };
  }
}

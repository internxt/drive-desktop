import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { TemporalFileCreator } from '../../../../../context/storage/TemporalFiles/application/creation/TemporalFileCreator';

export async function create(path: string, container: Container): Promise<Result<void, FuseError>> {
  try {
    await container.get(TemporalFileCreator).run(path);
    return { data: undefined };
  } catch (error: unknown) {
    logger.error({ msg: '[FUSE - Create] Unable to create temporal file', error, path });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Create] IO error: ${path}`) };
  }
}

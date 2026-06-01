import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { TemporalFileWriter } from '../../../../../context/storage/TemporalFiles/application/write/TemporalFileWriter';
import { ensureTemporalFileExistsForAuxiliaryPath } from './ensure-temporal-file-exists-for-auxiliary-path';

type WritePops = {
  path: string;
  content: Buffer;
  offset: number;
  container: Container;
};

export async function write({ path, content, offset, container }: WritePops): Promise<Result<number, FuseError>> {
  try {
    await ensureTemporalFileExistsForAuxiliaryPath({ path, container });
    await container.get(TemporalFileWriter).run(path, content, content.length, offset);
    return { data: content.length };
  } catch (error: unknown) {
    logger.error({ msg: '[FUSE - Write] Unable to write temporal file', error, path, offset });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Write] IO error: ${path}`) };
  }
}

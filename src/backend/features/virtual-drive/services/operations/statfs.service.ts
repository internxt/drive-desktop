import { Container } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { type Result } from '../../../../../context/shared/domain/Result';
import { FuseError, FuseIOError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { TemporalFileRepository } from '../../../../../context/storage/TemporalFiles/domain/TemporalFileRepository';

/**
 * v.2.6.0
 * Esteban Galvis Triana
 * Standard Linux NAME_MAX: the maximum number of bytes in a filename component.
 * Without this, f_namelen in statfs would be 0 and file managers (e.g. Nautilus)
 * would reject every rename attempt as "File name is too long".
 */
const NAME_MAX = 255;

export type StatFsResult = {
  blocks: number;
  bfree: number;
  bavail: number;
  files: number;
  ffree: number;
  bsize: number;
  nameLen: number;
};

type Props = {
  container: Container;
};

export async function statfs({ container }: Props): Promise<Result<StatFsResult, FuseError>> {
  try {
    const stats = await container.get(TemporalFileRepository).statFs();
    return { data: { ...stats, nameLen: NAME_MAX } };
  } catch (err) {
    logger.error({ msg: '[StatFs] Failed to read filesystem stats', error: err });
    return { error: new FuseIOError('Failed to read filesystem stats') };
  }
}

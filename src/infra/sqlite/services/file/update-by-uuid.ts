import { logger } from '@/apps/shared/logger/logger';
import { fileRepository } from '../drive-file';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: string;
  payload: Partial<DriveFile>;
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await fileRepository.update({ uuid }, payload);

    if (!match.affected) {
      return { error: new SingleItemError('NOT_FOUND') };
    }

    return { data: match.affected };
  } catch (exc) {
    logger.error({
      msg: 'Error updating file by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}

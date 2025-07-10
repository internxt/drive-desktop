import { logger } from '@/apps/shared/logger/logger';
import { folderRepository } from '../drive-folder';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: string;
  payload: Partial<DriveFolder>;
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await folderRepository.update({ uuid }, payload);

    if (!match.affected) {
      return { error: new SingleItemError('NOT_FOUND') };
    }

    return { data: match.affected };
  } catch (exc) {
    logger.error({
      msg: 'Error updating folder by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}

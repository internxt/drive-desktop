import { logger } from '@/apps/shared/logger/logger';
import { fileRepository } from '../drive-file';
import { SingleItemError } from '../common/single-item-error';
import { DriveFile, FileUuid } from '@/apps/main/database/entities/DriveFile';

type Props = {
  uuid: FileUuid;
  payload: {
    status?: DriveFile['status'];
    isDangledStatus?: boolean;
  };
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await fileRepository.update(
      { uuid },
      {
        status: payload.status,
        isDangledStatus: payload.isDangledStatus,
      },
    );

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

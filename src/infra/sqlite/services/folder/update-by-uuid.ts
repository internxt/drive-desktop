import { logger } from '@/apps/shared/logger/logger';
import { folderRepository } from '../drive-folder';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';

class UpdateByError extends Error {
  constructor(
    public readonly code: 'UNKNOWN' | 'NOT_FOUND',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type Props = {
  uuid: string;
  payload: Partial<DriveFolder>;
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await folderRepository.update({ uuid }, payload);

    if (!match.affected) {
      return { error: new UpdateByError('NOT_FOUND') };
    }

    return { data: match.affected };
  } catch (exc) {
    logger.error({
      msg: 'Error updating folder by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new UpdateByError('UNKNOWN', exc) };
  }
}

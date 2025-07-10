import { logger } from '@/apps/shared/logger/logger';
import { fileRepository } from '../drive-file';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';

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
  payload: Partial<DriveFile>;
};

export async function updateByUuid({ uuid, payload }: Props) {
  try {
    const match = await fileRepository.update({ uuid }, payload);

    if (!match.affected) {
      return { error: new UpdateByError('NOT_FOUND') };
    }

    return { data: match.affected };
  } catch (exc) {
    logger.error({
      msg: 'Error updating file by uuid',
      uuid,
      payload,
      exc,
    });

    return { error: new UpdateByError('UNKNOWN', exc) };
  }
}

import { ZodError } from 'zod';
import { checkpointsDb } from '../checkpoints-db';
import { CheckpointsSchema } from '../checkpoints-schema';
import { logger } from '@/apps/shared/logger/logger';
import { getKey } from './get-key';

class GetCheckpointError extends Error {
  constructor(
    public readonly code: 'PARSE_ZOD' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  userUuid: string;
  type: 'file' | 'folder';
  workspaceId: string;
};

export async function getCheckpoint(props: TProps) {
  try {
    const key = getKey(props);
    const checkpoint = checkpointsDb.findOne({ key });
    if (!checkpoint) return { data: undefined };

    const parsedCheckpoint = await CheckpointsSchema.parseAsync(checkpoint);
    return { data: parsedCheckpoint.checkpoint };
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Get checkpoint failed',
      props,
      exc,
    });

    if (exc instanceof ZodError) {
      return { error: new GetCheckpointError('PARSE_ZOD', exc) };
    }

    return { error: new GetCheckpointError('UNKNOWN', exc) };
  }
}

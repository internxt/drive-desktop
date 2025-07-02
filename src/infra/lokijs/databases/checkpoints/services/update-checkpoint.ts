import { ZodError } from 'zod';
import { checkpointsDb } from '../checkpoints-db';
import { CheckpointsSchema } from '../checkpoints-schema';
import { logger } from '@/apps/shared/logger/logger';
import { getKey } from './get-key';

class UpdateCheckpointError extends Error {
  constructor(
    public readonly code: 'PARSE_ZOD' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  userUuid: string;
  workspaceId: string;
  type: 'file' | 'folder';
  plainName: string;
  checkpoint: string;
};

export async function updateCheckpoint(props: TProps) {
  try {
    const key = getKey(props);
    const parsedProps = await CheckpointsSchema.parseAsync({ ...props, key });

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Update checkpoint',
      key,
      plainName: props.plainName,
      checkpoint: parsedProps.checkpoint,
    });

    const existing = checkpointsDb.findOne({ key });

    if (existing) {
      existing.checkpoint = parsedProps.checkpoint;
      return { data: checkpointsDb.update(existing) };
    } else {
      return { data: checkpointsDb.insertOne(parsedProps) };
    }
  } catch (exc) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Update checkpoint failed',
      props,
      exc,
    });

    if (exc instanceof ZodError) {
      return { error: new UpdateCheckpointError('PARSE_ZOD', exc) };
    }

    return { error: new UpdateCheckpointError('UNKNOWN', exc) };
  }
}

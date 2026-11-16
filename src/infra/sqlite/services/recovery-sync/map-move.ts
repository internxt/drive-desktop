import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { z } from 'zod';
import { RecoverySyncMove } from '../../schema';
import { SqliteError } from '../common/sqlite-error';

const moveRowSchema = z.object({
  rootUuid: z.string(),
  itemType: z.enum(['file', 'folder']),
  uuid: z.string(),
  source: z.string(),
  destination: z.string(),
  removalStatus: z.enum(['TRASHED', 'DELETED']),
  sourceSize: z.number().nullable(),
  sourceModifiedAt: z.string().nullable(),
  stage: z.enum(['reserved', 'moved', 'done', 'conflict', 'failed']),
});

export function mapMove({ row }: { row: unknown }): Result<RecoverySyncMove, SqliteError> {
  const parsed = moveRowSchema.safeParse(row);
  if (!parsed.success) return Result.err(new SqliteError('INVALID_ROW', parsed.error));
  return Result.ok(parsed.data);
}

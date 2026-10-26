import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { candidateSchema, RecoveryCandidate, scanSchema } from '../../types';
import { itemStorage, validBatchSize } from '../storage';
import { candidateBatchQuery } from './candidateBatchQuery';

/** Reads an indexed candidate batch, including original state and observations, without loading the full inventory. */
export function listCandidates({
  database,
  scanId,
  after = '',
  limit = 1000,
  selection = 'all',
}: {
  database: DatabaseSync;
  scanId: number;
  after?: string;
  limit?: number;
  selection?: 'all' | 'unobserved' | 'removed';
}): Result<RecoveryCandidate[]> {
  if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
  const row = database.prepare('SELECT * FROM recovery_scan WHERE scanId = ?').get(scanId);
  if (!row) return Result.err(new Error('Recovery scan not found'));
  const scan = scanSchema.parse(row);
  const rows = database.prepare(candidateBatchQuery({ selection })).all(scanId, after, limit);
  return Result.ok(
    rows.map((candidate) => {
      const parsed = candidateSchema.parse(candidate);
      const original = itemStorage(scan.itemType).schema.parse(JSON.parse(parsed.original));
      return { ...parsed, original };
    }),
  );
}

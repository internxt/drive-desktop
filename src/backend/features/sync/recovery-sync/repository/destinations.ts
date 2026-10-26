import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { destinationSchema, RecoveryDestination } from '../types';
import { validBatchSize } from './storage';

/** Reads the reserved destination so retries reuse the same folder on this volume. */
export function getDestination({
  database,
  rootUuid,
  volume,
}: {
  database: DatabaseSync;
  rootUuid: string;
  volume: string;
}): Result<RecoveryDestination | undefined> {
  try {
    const row = database.prepare('SELECT * FROM recovery_destination WHERE rootUuid = ? AND volume = ?').get(rootUuid, volume);
    return Result.ok(row ? destinationSchema.parse(row) : undefined);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Reserves a destination path exclusively; the database rejects collisions with other recoveries. */
export function insertDestination({
  database,
  rootUuid,
  volume,
  path,
}: {
  database: DatabaseSync;
  rootUuid: string;
  volume: string;
  path: string;
}): Result<RecoveryDestination> {
  try {
    const row = database
      .prepare('INSERT INTO recovery_destination (rootUuid, volume, path) VALUES (?, ?, ?) RETURNING *')
      .get(rootUuid, volume, path);
    return Result.ok(destinationSchema.parse(row));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Records folder creation only during preservation, so moves cannot target an uncreated destination. */
export function markDestinationCreated({
  database,
  rootUuid,
  volume,
}: {
  database: DatabaseSync;
  rootUuid: string;
  volume: string;
}): Result<void> {
  try {
    const result = database
      .prepare(
        `UPDATE recovery_destination SET created = 1 WHERE rootUuid = ? AND volume = ?
    AND EXISTS (SELECT 1 FROM recovery_process WHERE rootUuid = ? AND stage = 'preserving')`,
      )
      .run(rootUuid, volume, rootUuid);
    return result.changes ? Result.ok(undefined) : Result.err(new Error('Recovery destination is not active'));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Reads destinations in bounded volume order so callers can resume without loading every reservation. */
export function listDestinations({
  database,
  rootUuid,
  after = '',
  limit = 1000,
}: {
  database: DatabaseSync;
  rootUuid: string;
  after?: string;
  limit?: number;
}): Result<RecoveryDestination[]> {
  try {
    if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
    const rows = database
      .prepare('SELECT * FROM recovery_destination WHERE rootUuid = ? AND volume > ? COLLATE NOCASE ORDER BY volume LIMIT ?')
      .all(rootUuid, after, limit);
    return Result.ok(z.array(destinationSchema).parse(rows));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

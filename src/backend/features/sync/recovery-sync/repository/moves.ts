import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { win32 } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { candidateSchema, moveSchema, RecoveryMove, RecoveryScan, scanSchema } from '../types';
import { itemStorage, validBatchSize } from './storage';

/** Reloads persisted move progress so retries do not rely on state read before acquiring the guard. */
export function getMove({ database, moveId }: { database: DatabaseSync; moveId: number }): Result<RecoveryMove> {
  try {
    const row = database.prepare('SELECT * FROM recovery_move WHERE moveId = ?').get(moveId);
    return row ? Result.ok(moveSchema.parse(row)) : Result.err(new Error('Recovery move not found'));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Finds an item's existing move so retries retain its original destination and progress. */
export function getMoveByItem({
  database,
  scanId,
  uuid,
}: {
  database: DatabaseSync;
  scanId: number;
  uuid: string;
}): Result<RecoveryMove | undefined> {
  try {
    const row = database.prepare('SELECT * FROM recovery_move WHERE scanId = ? AND uuid = ?').get(scanId, uuid);
    return Result.ok(row ? moveSchema.parse(row) : undefined);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Restricts move updates to a process that is still preserving local contents. */
export function getPreservingMove({ database, moveId }: { database: DatabaseSync; moveId: number }): Result<RecoveryMove> {
  try {
    const row = database
      .prepare(
        `SELECT m.* FROM recovery_move m JOIN recovery_scan s USING (scanId)
    JOIN recovery_process p USING (rootUuid) WHERE moveId = ? AND p.stage = 'preserving'`,
      )
      .get(moveId);
    return row ? Result.ok(moveSchema.parse(row)) : Result.err(new Error('Recovery move is not active'));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Saves move intent before filesystem work so an interrupted move can be retried at its reserved path. */
export function insertMove({
  database,
  scanId,
  uuid,
  volume,
  source,
  destination,
  expected,
  removalStatus,
}: {
  database: DatabaseSync;
  scanId: number;
  uuid: string;
  volume: string;
  source: string;
  destination: string;
  expected: string;
  removalStatus: 'TRASHED' | 'DELETED';
}): Result<RecoveryMove> {
  try {
    const row = database
      .prepare(
        `INSERT INTO recovery_move (scanId, uuid, volume, source, destination, expected, removalStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(scanId, uuid, volume, source, destination, expected, removalStatus);
    return Result.ok(moveSchema.parse(row));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Reads a bounded batch of moves in one stage so unfinished preservation can resume incrementally. */
export function listMoves({
  database,
  scanId,
  stage,
  after = 0,
  limit = 1000,
}: {
  database: DatabaseSync;
  scanId: number;
  stage: RecoveryMove['stage'];
  after?: number;
  limit?: number;
}): Result<RecoveryMove[]> {
  try {
    if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
    const rows = database
      .prepare('SELECT * FROM recovery_move WHERE scanId = ? AND stage = ? AND moveId > ? ORDER BY moveId LIMIT ?')
      .all(scanId, stage, after, limit);
    return Result.ok(z.array(moveSchema).parse(rows));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Finds recorded moves for a normalized source path so watcher coordination can recognize recovery work. */
export function listMovesBySource({
  database,
  source,
  after = 0,
  limit = 1000,
}: {
  database: DatabaseSync;
  source: string;
  after?: number;
  limit?: number;
}): Result<RecoveryMove[]> {
  try {
    if (!validBatchSize(limit)) return Result.err(new Error('Invalid batch size'));
    const rows = database
      .prepare('SELECT * FROM recovery_move WHERE source = ? AND moveId > ? ORDER BY moveId LIMIT ?')
      .all(win32.resolve(source), after, limit);
    return Result.ok(z.array(moveSchema).parse(rows));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Records successful content preservation; commit with the process count in the caller's transaction. */
export function recordPreservedContents({
  database,
  moveId,
  preservedFileCount,
}: {
  database: DatabaseSync;
  moveId: number;
  preservedFileCount: number;
}): Result<void> {
  try {
    database.prepare("UPDATE recovery_move SET stage = 'moved', preservedFileCount = ? WHERE moveId = ?").run(preservedFileCount, moveId);
    return Result.ok(undefined);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Records whether the original local version was removed or changed; commit with the local status update. */
export function updateMoveResolution({
  database,
  moveId,
  stage,
}: {
  database: DatabaseSync;
  moveId: number;
  stage: 'completed' | 'conflict';
}): Result<void> {
  try {
    database.prepare('UPDATE recovery_move SET stage = ? WHERE moveId = ?').run(stage, moveId);
    return Result.ok(undefined);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Allows preservation only after this scan finished and its process entered the preserving stage. */
export function getPreservingScan({ database, scanId }: { database: DatabaseSync; scanId: number }): Result<RecoveryScan> {
  try {
    const row = database
      .prepare(
        `SELECT s.* FROM recovery_scan s JOIN recovery_process p USING (rootUuid)
    WHERE scanId = ? AND p.stage = 'preserving' AND s.stage = 'completed'`,
      )
      .get(scanId);
    return row ? Result.ok(scanSchema.parse(row)) : Result.err(new Error('Recovery preservation is not active'));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Reads the scan's item type and ownership before updating the corresponding local item table. */
export function getScan({ database, scanId }: { database: DatabaseSync; scanId: number }): Result<RecoveryScan> {
  try {
    const row = database.prepare('SELECT * FROM recovery_scan WHERE scanId = ?').get(scanId);
    return row ? Result.ok(scanSchema.parse(row)) : Result.err(new Error('Recovery scan not found'));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Selects only unseen or remotely removed candidates; observed existing items must not be preserved as removals. */
export function getPreservationCandidate({
  database,
  scanId,
  uuid,
}: {
  database: DatabaseSync;
  scanId: number;
  uuid: string;
}): Result<z.infer<typeof candidateSchema>> {
  try {
    const row = database
      .prepare(
        `SELECT * FROM recovery_candidate WHERE scanId = ? AND uuid = ?
    AND (observed = 0 OR removedStatus IS NOT NULL)`,
      )
      .get(scanId, uuid);
    return row ? Result.ok(candidateSchema.parse(row)) : Result.err(new Error('Recovery candidate is not eligible for preservation'));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Compares all persisted fields because status-only edits do not necessarily change updatedAt. */
export function matchesOriginalItem({
  database,
  itemType,
  uuid,
  original,
}: {
  database: DatabaseSync;
  itemType: 'file' | 'folder';
  uuid: string;
  original: string;
}): Result<boolean> {
  try {
    const { table, snapshot } = itemStorage(itemType);
    const row = database.prepare(`SELECT uuid FROM ${table} WHERE uuid = ? AND ${snapshot} = ?`).get(uuid, original);
    return Result.ok(Boolean(row));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Changes local status only while the full row still matches its snapshot, preserving concurrent edits atomically. */
export function removeUnchangedItem({
  database,
  scan,
  move,
}: {
  database: DatabaseSync;
  scan: Pick<RecoveryScan, 'itemType' | 'userUuid' | 'workspaceId'>;
  move: Pick<RecoveryMove, 'uuid' | 'removalStatus' | 'expected'>;
}): Result<boolean> {
  try {
    const { table, snapshot } = itemStorage(scan.itemType);
    const result = database
      .prepare(`UPDATE ${table} SET status = ? WHERE uuid = ? AND userUuid = ? AND workspaceId = ? AND ${snapshot} = ?`)
      .run(move.removalStatus, move.uuid, scan.userUuid, scan.workspaceId, move.expected);
    return Result.ok(Number(result.changes) === 1);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

/** Adds a move's count in the same transaction as its moved stage, preventing double counting on retry. */
export function incrementPreservedFileCount({
  database,
  scanId,
  preservedFileCount,
}: {
  database: DatabaseSync;
  scanId: number;
  preservedFileCount: number;
}): Result<void> {
  try {
    database
      .prepare(
        `UPDATE recovery_process SET preservedFileCount = preservedFileCount + ?
    WHERE rootUuid = (SELECT rootUuid FROM recovery_scan WHERE scanId = ?)`,
      )
      .run(preservedFileCount, scanId);
    return Result.ok(undefined);
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
}

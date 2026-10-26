import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { win32 } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DestinationRepository, MoveRepository } from '../../repository';
import { fileSchema, folderSchema, RecoveryMove } from '../../types';

/**
 * Records where an eligible item's contents will be preserved before any filesystem work starts.
 * Retries reuse the existing move. Execute through accessDatabase with transaction: true to keep eligibility checks and reservation atomic.
 */
export function reserveMove({
  database,
  scanId,
  uuid,
  volume,
  source,
  destination,
  removalStatus,
}: {
  database: DatabaseSync;
  scanId: number;
  uuid: string;
  volume: string;
  source: string;
  destination: string;
  removalStatus: 'TRASHED' | 'DELETED';
}): Result<RecoveryMove> {
  const scanned = MoveRepository.getPreservingScan({ database, scanId });
  if (Result.isError(scanned)) return scanned;
  const scan = scanned.data;
  const existing = MoveRepository.getMoveByItem({ database, scanId, uuid });
  if (Result.isError(existing)) return existing;
  if (existing.data) return Result.ok(existing.data);
  const target = DestinationRepository.getDestination({ database, rootUuid: scan.rootUuid, volume });
  if (Result.isError(target)) return target;
  if (!target.data || !target.data.created) return Result.err(new Error('Recovery destination has not been created'));
  const sourcePath = win32.resolve(source);
  const destinationPath = win32.resolve(destination);
  const relative = win32.relative(target.data.path, destinationPath);
  if (
    !win32.isAbsolute(source) ||
    !win32.isAbsolute(destination) ||
    !relative ||
    relative === '..' ||
    relative.startsWith('..\\') ||
    win32.isAbsolute(relative) ||
    win32.parse(sourcePath).root.toLowerCase() !== volume.toLowerCase()
  ) {
    return Result.err(new Error('Recovery move must stay inside its allocated destination and source volume'));
  }
  const selected = MoveRepository.getPreservationCandidate({ database, scanId, uuid });
  if (Result.isError(selected)) return selected;
  const candidate = selected.data;
  try {
    const schema = scan.itemType === 'file' ? fileSchema : folderSchema;
    schema.parse(JSON.parse(candidate.original));
  } catch (cause) {
    return Result.err(cause instanceof Error ? cause : new Error(String(cause)));
  }
  if (candidate.removedStatus && candidate.removedStatus !== removalStatus)
    return Result.err(new Error('Recovery removal status conflict'));
  const unchanged = MoveRepository.matchesOriginalItem({ database, itemType: scan.itemType, uuid, original: candidate.original });
  if (Result.isError(unchanged)) return unchanged;
  if (!unchanged.data) return Result.err(new Error('Recovery candidate changed since preparation'));
  return MoveRepository.insertMove({
    database,
    scanId,
    uuid,
    volume,
    source: sourcePath,
    destination: destinationPath,
    expected: candidate.original,
    removalStatus,
  });
}

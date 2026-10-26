import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { win32 } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DestinationRepository, ProcessRepository } from '../../repository';
import { RecoveryDestination } from '../../types';

/**
 * Reuses or reserves a recovery folder on the source volume, keeping preserved contents on the same drive.
 * Execute through accessDatabase with transaction: true so the stage check and reservation share one transaction.
 */
export function reserveDestination({
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
  const destinationPath = win32.resolve(path);
  if (
    !win32.isAbsolute(path) ||
    win32.parse(path).root.toLowerCase() !== volume.toLowerCase() ||
    destinationPath.toLowerCase() === volume.toLowerCase()
  ) {
    return Result.err(new Error('Recovery destination must be a directory on its source volume'));
  }
  const process = ProcessRepository.getProcess({ database, rootUuid });
  if (Result.isError(process)) return process;
  if (!process.data || process.data.stage !== 'preserving') return Result.err(new Error('Recovery preservation is not active'));
  const existing = DestinationRepository.getDestination({ database, rootUuid, volume });
  if (Result.isError(existing)) return existing;
  if (existing.data) return Result.ok(existing.data);
  return DestinationRepository.insertDestination({ database, rootUuid, volume, path: destinationPath });
}

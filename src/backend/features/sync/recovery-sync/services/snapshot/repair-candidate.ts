import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { DriveFile, DriveFolder } from '@/infra/sqlite/schema';
import { ScanRepository, SnapshotRepository } from '../../repository';
import { fileSchema, folderSchema } from '../../types';

/** Repairs eligible metadata only when original state still matches, allowing identical replay; execute with transaction: true. */
export function repairCandidate({
  database,
  scanId,
  uuid,
  item,
}: {
  database: DatabaseSync;
  scanId: number;
  uuid: string;
  item: DriveFile | DriveFolder;
}): Result<void> {
  const result = ScanRepository.getScanningScan({ database, scanId });
  if (Result.isError(result)) return result;
  const scan = result.data;
  if (!scan) return Result.err(new Error('Recovery scan is not active'));
  const schema = scan.itemType === 'file' ? fileSchema : folderSchema;
  const mapped = schema.safeParse(item);
  if (!mapped.success) return Result.err(mapped.error);
  const parsed = mapped.data;
  if (parsed.uuid !== uuid || parsed.userUuid !== scan.userUuid || parsed.workspaceId !== scan.workspaceId || parsed.status !== 'EXISTS') {
    return Result.err(new Error('Recovery repairs must keep identity, Drive ownership and existing status'));
  }
  const updated = SnapshotRepository.updateCandidateIfUnchanged({ database, scan, item: parsed });
  if (Result.isError(updated)) return updated;
  return updated.data ? Result.ok(undefined) : Result.err(new Error('Recovery candidate changed since preparation'));
}

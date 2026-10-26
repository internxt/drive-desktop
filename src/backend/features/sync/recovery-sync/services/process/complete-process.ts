import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { ProcessRepository } from '../../repository';

/** Removes finished recovery state for this root; execute through accessDatabase with transaction: true. */
export function completeProcess(props: { database: DatabaseSync; rootUuid: string }): Result<void> {
  return ProcessRepository.deleteProcess(props);
}

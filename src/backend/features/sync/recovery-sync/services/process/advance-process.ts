import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { ProcessRepository } from '../../repository';
import { RECOVERY_SYNC_STAGES } from './constants';

/** Applies the workflow's forward transition while the repository checks its prerequisites atomically. */
export function advanceProcess({
  database,
  rootUuid,
  stage,
}: {
  database: DatabaseSync;
  rootUuid: string;
  stage: (typeof RECOVERY_SYNC_STAGES)[keyof typeof RECOVERY_SYNC_STAGES];
}): Result<void> {
  switch (stage) {
    case RECOVERY_SYNC_STAGES.SCANNING:
      return ProcessRepository.updateProcessStage({ database, rootUuid, stage, expectedStage: 'preparing', requiredScanStage: 'scanning' });
    case RECOVERY_SYNC_STAGES.PRESERVING:
      return ProcessRepository.updateProcessStage({ database, rootUuid, stage, expectedStage: 'scanning', requiredScanStage: 'completed' });
    case RECOVERY_SYNC_STAGES.REPORTING:
      return ProcessRepository.updateProcessStage({
        database,
        rootUuid,
        stage,
        expectedStage: 'preserving',
        requiredScanStage: 'completed',
      });
  }
}

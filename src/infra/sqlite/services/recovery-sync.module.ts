import { allocateDestination } from './recovery-sync/allocate-destination';
import { areScansCompleted } from './recovery-sync/are-scans-completed';
import { clearRecovery } from './recovery-sync/clear-recovery';
import { commitScanPage } from './recovery-sync/commit-scan-page';
import { getFilesToPreserve, getFoldersToPreserve } from './recovery-sync/get-items-to-preserve';
import { getUnfinishedMoves } from './recovery-sync/get-unfinished-moves';
import { hasProtectedDescendants } from './recovery-sync/has-protected-descendants';
import { isBeingPreserved } from './recovery-sync/is-being-preserved';
import { markRemovedIfEligible } from './recovery-sync/mark-removed-if-eligible';
import { reserveMove } from './recovery-sync/reserve-move';
import { setMoveStage } from './recovery-sync/set-move-stage';
import { startOrResumeProcess } from './recovery-sync/start-or-resume-process';
import { startOrResumeScan } from './recovery-sync/start-or-resume-scan';

export const RecoverySyncModule = {
  startOrResumeProcess,
  startOrResumeScan,
  commitScanPage,
  areScansCompleted,
  getFilesToPreserve,
  getFoldersToPreserve,
  hasProtectedDescendants,
  allocateDestination,
  reserveMove,
  setMoveStage,
  getUnfinishedMoves,
  isBeingPreserved,
  markRemovedIfEligible,
  clearRecovery,
};

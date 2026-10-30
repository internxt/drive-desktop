import { areScansCompleted } from './recovery-sync/are-scans-completed';
import { clearRecovery } from './recovery-sync/clear-recovery';
import { commitScanPage } from './recovery-sync/commit-scan-page';
import { getFilesToPreserve, getFoldersToPreserve } from './recovery-sync/get-items-to-preserve';
import { markRemovedIfEligible } from './recovery-sync/mark-removed-if-eligible';
import { startOrResumeScan } from './recovery-sync/start-or-resume-scan';

export const RecoverySyncModule = {
  startOrResumeScan,
  commitScanPage,
  areScansCompleted,
  getFilesToPreserve,
  getFoldersToPreserve,
  markRemovedIfEligible,
  clearRecovery,
};

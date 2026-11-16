import { win32 } from 'node:path';
import { addSyncIssue, removeSyncIssuesByError } from '@/apps/main/background-processes/issues';

/**
 * v2.7.2 Alexis Mora
 * The issues of the previous run are replaced by the ones of this run, so an item that was preserved on retry
 * stops showing as an issue and an item that keeps failing shows once.
 */
export function reportPreservationIssues({ failed }: { failed: string[] }) {
  removeSyncIssuesByError({ error: 'RECOVERY_SYNC_NOT_PRESERVED' });

  for (const path of failed) {
    addSyncIssue({ name: win32.normalize(path), error: 'RECOVERY_SYNC_NOT_PRESERVED' });
  }
}

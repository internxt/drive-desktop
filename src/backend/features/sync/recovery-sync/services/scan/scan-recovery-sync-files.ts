import { SyncContext } from '@/apps/sync-engine/config';
import { fetchRecoverySyncFilesPage } from './fetch-recovery-sync-page';
import { repairRecoverySyncFiles } from './repair-recovery-sync-items';
import { scanRecoverySyncItems } from './scan-recovery-sync-items';

export async function scanRecoverySyncFiles({ ctx }: { ctx: SyncContext }) {
  return await scanRecoverySyncItems({
    ctx,
    itemType: 'file',
    fetchPage: async ({ request }) => await fetchRecoverySyncFilesPage({ ctx, request }),
    repairItems: async ({ items, checkpoint }) => await repairRecoverySyncFiles({ ctx, items, checkpoint }),
  });
}

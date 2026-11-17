import { SyncContext } from '@/apps/sync-engine/config';
import { fetchRecoverySyncFoldersPage } from './fetch-recovery-sync-page';
import { repairRecoverySyncFolders } from './repair-recovery-sync-items';
import { scanRecoverySyncItems } from './scan-recovery-sync-items';

export async function scanRecoverySyncFolders({ ctx }: { ctx: SyncContext }) {
  return await scanRecoverySyncItems({
    ctx,
    itemType: 'folder',
    fetchPage: async ({ request }) => await fetchRecoverySyncFoldersPage({ ctx, request }),
    repairItems: async ({ items, checkpoint }) => await repairRecoverySyncFolders({ ctx, items, checkpoint }),
  });
}

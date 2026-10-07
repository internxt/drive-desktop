import { logger } from '@/apps/shared/logger/logger';
import { getRegistration, SyncRootRegistration } from './get-registration';
import { isSyncRootCandidate } from './is-sync-root-candidate';
import { queryKey, SYNC_ROOT_MANAGER_KEY } from './registry';

export type { SyncRootRegistration } from './get-registration';

export async function getSyncRootRegistrations(): Promise<SyncRootRegistration[]> {
  try {
    const { subKeys: ids } = await queryKey({ key: SYNC_ROOT_MANAGER_KEY });

    const candidateIds = ids.filter(isSyncRootCandidate);
    const results = await Promise.all(candidateIds.map(getRegistration));

    return results.flatMap(({ data }) => (data ? [data] : []));
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error reading sync root registrations', exc });
    return [];
  }
}

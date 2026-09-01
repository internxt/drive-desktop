import { logger } from '@/apps/shared/logger/logger';
import { queryKeys, queryValues, SYNC_ROOT_MANAGER_KEY, tryQueryValues } from './registry';

export type SyncRootRegistration = {
  id: string;
  displayName: string;
  namespaceClsid: string;
  hasUserSyncRoots: boolean;
};

export async function getSyncRootRegistrations(): Promise<SyncRootRegistration[]> {
  try {
    const ids = await queryKeys({ key: SYNC_ROOT_MANAGER_KEY });

    const registrations = await Promise.all(
      ids.map(async (id) => {
        const key = `${SYNC_ROOT_MANAGER_KEY}\\${id}`;
        const values = await queryValues({ key });
        const userSyncRoots = await tryQueryValues({ key: `${key}\\UserSyncRoots` });

        return {
          id,
          displayName: values.DisplayNameResource ?? '',
          namespaceClsid: values.NamespaceCLSID ?? '',
          hasUserSyncRoots: Object.keys(userSyncRoots).length > 0,
        };
      }),
    );

    return registrations;
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error reading sync root registrations', exc });
    return [];
  }
}

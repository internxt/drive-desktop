import { logger } from '@/apps/shared/logger/logger';
import { queryKey, SYNC_ROOT_MANAGER_KEY } from './registry';

export type SyncRootRegistration = {
  id: string;
  displayName: string;
  namespaceClsid: string;
  hasUserSyncRoots: boolean;
};

export async function getSyncRootRegistrations(): Promise<SyncRootRegistration[]> {
  try {
    const { subKeys: ids } = await queryKey({ key: SYNC_ROOT_MANAGER_KEY });

    const registrations = await Promise.all(
      ids.map(async (id) => {
        const { values, subKeys } = await queryKey({ key: `${SYNC_ROOT_MANAGER_KEY}\\${id}` });

        return {
          id,
          displayName: values.DisplayNameResource ?? '',
          namespaceClsid: values.NamespaceCLSID ?? '',
          hasUserSyncRoots: subKeys.includes('UserSyncRoots'),
        };
      }),
    );

    return registrations;
  } catch (exc) {
    logger.error({ tag: 'SYNC-ENGINE', msg: 'Error reading sync root registrations', exc });
    return [];
  }
}

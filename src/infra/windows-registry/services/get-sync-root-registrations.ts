import { logger } from '@/apps/shared/logger/logger';
import { CLSID_KEY, queryKey, SYNC_ROOT_MANAGER_KEY } from './registry';

export type SyncRootRegistration = {
  id: string;
  displayName: string;
  namespaceClsid: string;
  targetFolderPath: string;
  hasUserSyncRoots: boolean;
};

async function getTargetFolderPath({ namespaceClsid }: { namespaceClsid: string }) {
  if (!namespaceClsid) return '';

  try {
    const { values } = await queryKey({ key: `${CLSID_KEY}\\${namespaceClsid}\\Instance\\InitPropertyBag` });
    return values.TargetFolderPath ?? '';
  } catch {
    return '';
  }
}

export async function getSyncRootRegistrations(): Promise<SyncRootRegistration[]> {
  try {
    const { subKeys: ids } = await queryKey({ key: SYNC_ROOT_MANAGER_KEY });

    const registrations = await Promise.all(
      ids.map(async (id) => {
        const { values, subKeys } = await queryKey({ key: `${SYNC_ROOT_MANAGER_KEY}\\${id}` });
        const namespaceClsid = values.NamespaceCLSID ?? '';

        return {
          id,
          displayName: values.DisplayNameResource ?? '',
          namespaceClsid,
          targetFolderPath: await getTargetFolderPath({ namespaceClsid }),
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

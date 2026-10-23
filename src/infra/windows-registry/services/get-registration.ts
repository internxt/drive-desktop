import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { logger } from '@/apps/shared/logger/logger';
import { CLSID_KEY, queryKey, SYNC_ROOT_MANAGER_KEY } from './registry';

export type SyncRootRegistration = {
  id: string;
  displayName: string;
  namespaceClsid: string;
  targetFolderPath: string;
  hasUserSyncRoots: boolean;
};

/**
 * Windows can retain orphan registry entries that native sync-root enumeration no longer returns.
 * Reading each entry independently lets cleanup continue when another candidate is inaccessible.
 */
export async function getRegistration(id: string): Promise<Result<SyncRootRegistration>> {
  try {
    const { values, subKeys } = await queryKey({ key: `${SYNC_ROOT_MANAGER_KEY}\\${id}` });
    const namespaceClsid = values.NamespaceCLSID ?? '';

    return {
      data: {
        id,
        displayName: values.DisplayNameResource ?? '',
        namespaceClsid,
        targetFolderPath: await getTargetFolderPath(namespaceClsid),
        hasUserSyncRoots: subKeys.includes('UserSyncRoots'),
      },
      error: undefined,
    };
  } catch (exc) {
    const error = exc instanceof Error ? exc : new Error('Cannot read sync root registration', { cause: exc });
    logger.warn({ tag: 'SYNC-ENGINE', msg: 'Skipping unreadable sync root registration', id, exc: error });
    return { data: undefined, error };
  }
}

async function getTargetFolderPath(namespaceClsid: string) {
  if (!namespaceClsid) return '';

  try {
    const { values } = await queryKey({ key: `${CLSID_KEY}\\${namespaceClsid}\\Instance\\InitPropertyBag` });
    return values.TargetFolderPath ?? '';
  } catch {
    return '';
  }
}

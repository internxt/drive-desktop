import { logger } from '@/apps/shared/logger/logger';
import { SyncRootRegistration } from './get-sync-root-registrations';
import { CLSID_KEY, deleteKey, NAMESPACE_KEY, SYNC_ROOT_MANAGER_KEY } from './registry';

export async function removeSyncRootRegistration({ registration }: { registration: SyncRootRegistration }) {
  const { id, namespaceClsid } = registration;

  logger.debug({ tag: 'SYNC-ENGINE', msg: 'Removing orphan sync root registration', registration });

  const keys = namespaceClsid
    ? [`${NAMESPACE_KEY}\\${namespaceClsid}`, `${CLSID_KEY}\\${namespaceClsid}`, `${SYNC_ROOT_MANAGER_KEY}\\${id}`]
    : [`${SYNC_ROOT_MANAGER_KEY}\\${id}`];

  for (const key of keys) {
    try {
      await deleteKey({ key });
    } catch (exc) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error removing orphan sync root key', key, exc });
    }
  }
}

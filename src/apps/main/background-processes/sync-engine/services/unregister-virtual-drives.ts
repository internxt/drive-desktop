import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  currentProviderIds?: string[];
};

export function unregisterVirtualDrives({ currentProviderIds = [] }: TProps) {
  const syncRoots = VirtualDrive.getRegisteredSyncRoots();

  const internxtSyncRoots = syncRoots.filter((syncRoot) => {
    const isFromInternxt = syncRoot.displayName.toLowerCase().includes('internxt') || syncRoot.path.toLowerCase().includes('internxt');

    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Sync root', isFromInternxt, syncRoot });

    return isFromInternxt;
  });

  logger.debug({ msg: 'Current provider ids', currentProviderIds });

  internxtSyncRoots.forEach((syncRoot) => {
    if (!currentProviderIds.includes(syncRoot.id)) {
      logger.debug({ msg: 'Unregistering sync root', syncRoot });
      /**
       * v2.5.1 Daniel Jiménez
       * Just unregister the root folder. Do not delete the folder itself (maybe there were some files that were not synced,
       * and we lose them - it happened). Also, do not clear the database, because since we are keeping the files, we also need to keep
       * the lastSyncCheckpoint of files and folders.
       */
      try {
        VirtualDrive.unregisterSyncRoot({ providerId: syncRoot.id });
      } catch (exc) {
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error unregistering sync root',
          syncRoot,
          exc,
        });
      }
    }
  });
}

import { logger } from '@/apps/shared/logger/logger';
import VirtualDrive from '@/node-win/virtual-drive';

type TProps = {
  currentProviderIds?: string[];
};

export function unregisterVirtualDrives({ currentProviderIds = [] }: TProps) {
  const syncRoots = VirtualDrive.getRegisteredSyncRoots();

  logger.debug({ msg: 'Current provider ids', currentProviderIds });

  syncRoots.forEach((syncRoot) => {
    if (!currentProviderIds.includes(syncRoot.id)) {
      logger.debug({ msg: 'Unregistering sync root', syncRoot });
      /**
       * v2.5.1 Daniel Jiménez
       * Just unregister the root folder. Do not delete the folder itself (maybe there were some files that were not synced,
       * and we lose them - it happened). Also, do not clear the database, because since we are keeping the files, we also need to keep
       * the lastSyncCheckpoint of files and folders.
       */
      VirtualDrive.unregisterSyncRoot({ providerId: syncRoot.id });
    }
  });
}

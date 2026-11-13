import { logger } from '@internxt/drive-desktop-core/build/backend';
import { BackupScheduler } from '@/apps/main/background-processes/backups/BackupScheduler/BackupScheduler';
import { workers } from '@/apps/main/remote-sync/store';
import { setTrayStatus } from '@/apps/main/tray/tray';
import { stopMailBridge } from '@/backend/features/mail-bridge';

/**
 * v2.7.2 Alexis Mora
 * Stops what runs in the background. Cleaner, antivirus and settings are only reachable from the widget, which
 * shows the update banner instead. We only stop the schedules and the watcher instead of running the logout
 * teardown, so the sync root, its placeholders and local changes stay on disk and the first sync after updating
 * picks them up.
 */
export function haltFeatures() {
  logger.warn({ msg: '*****************************************************************************************************************' });
  logger.warn({ msg: 'Halting features because this client version is no longer supported', workers: workers.size });
  logger.warn({ msg: '*****************************************************************************************************************' });
  BackupScheduler.stop();

  for (const worker of workers.values()) {
    clearInterval(worker.syncSchedule);
    worker.watcher?.unsubscribe();
    worker.watcher = undefined;
  }

  void stopMailBridge();
  setTrayStatus('ALERT');
}

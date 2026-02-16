import { setTrayStatus } from '../tray/tray';
import { stopRemoteNotifications } from '../realtime';
import { LocalSync } from '@/backend/features';
import { remoteSyncManagers } from '../remote-sync/store';
import { clearAntivirus } from '../antivirus/utils/initializeAntivirus';
import { clearIssues } from '../background-processes/issues';
import { closeAuxWindows } from '../windows';
import { cleanSyncEngineWorkers } from '../background-processes/sync-engine/services/stop-sync-engine-worker';
import { AuthModule } from '@/backend/features/auth/auth.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { AuthContext } from '@/apps/sync-engine/config';
import { setIsLoggedIn } from './handlers';
import { getWidget } from '../windows/widget';

type Props = {
  ctx: AuthContext;
};

export function logout({ ctx }: Props) {
  try {
    logger.debug({ tag: 'AUTH', msg: 'Drive API bottleneck jobs', jobs: ctx.driveApiBottleneck.counts() });
    logger.debug({ tag: 'AUTH', msg: 'Upload bottleneck jobs', jobs: ctx.uploadBottleneck.counts() });
    void ctx.driveApiBottleneck.stop({ dropWaitingJobs: true });
    void ctx.uploadBottleneck.stop({ dropWaitingJobs: true });
    ctx.abortController.abort();

    setTrayStatus('IDLE');

    setIsLoggedIn(false);
    closeAuxWindows();
    getWidget().show();

    stopRemoteNotifications();
    LocalSync.SyncState.onLogout();
    remoteSyncManagers.clear();
    clearAntivirus();
    clearIssues();

    void cleanSyncEngineWorkers();
    AuthModule.logout();
  } catch (error) {
    logger.error({
      tag: 'AUTH',
      msg: 'Error logging out',
      error,
    });
  }
}

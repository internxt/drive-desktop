import { logger } from '@internxt/drive-desktop-core/build/backend';
import { AuthContext } from '@/apps/sync-engine/config';
import { LocalSync } from '@/backend/features';
import { AuthModule } from '@/backend/features/auth/auth.module';
import { clearAntivirus } from '../antivirus/utils/initializeAntivirus';
import { clearIssues } from '../background-processes/issues';
import { cleanSyncEngineWorkers } from '../background-processes/sync-engine/services/stop-sync-engine-worker';
import { stopRemoteNotifications } from '../realtime';
import { setTrayStatus } from '../tray/tray';
import { closeAuxWindows } from '../windows';
import { showFrontend } from '../windows/widget';
import { setIsLoggedIn } from './handlers';

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

    setIsLoggedIn(null);
    closeAuxWindows();
    showFrontend();

    stopRemoteNotifications();
    LocalSync.SyncState.onLogout();
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

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
import { AuthContext } from '@/backend/features/auth/utils/context';
import { createAuthWindow } from '../windows/auth';
import { setIsLoggedIn } from './handlers';

type Props = {
  ctx: AuthContext;
};

export async function logout({ ctx }: Props) {
  try {
    ctx.abortController.abort();
    setIsLoggedIn(false);

    setTrayStatus('IDLE');

    closeAuxWindows();
    await createAuthWindow();

    stopRemoteNotifications();
    LocalSync.SyncState.onLogout();
    remoteSyncManagers.clear();
    clearAntivirus();
    clearIssues();

    void cleanSyncEngineWorkers();
    void AuthModule.logout();
  } catch (error) {
    logger.error({
      tag: 'AUTH',
      msg: 'Error logging out',
      error,
    });
  }
}

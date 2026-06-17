import { logger } from '@internxt/drive-desktop-core/build/backend';
import eventBus from '../../apps/main/event-bus';
import { AppDataSource, resetAppDataSourceOnLogout } from '../../apps/main/database/data-source';
import { getOrCreateWidged, getWidget, setBoundsOfWidgetByPath } from '../../apps/main/windows/widget';
import { createAuthWindow, getAuthWindow } from '../../apps/main/windows/auth';
import configStore from '../../apps/main/config';
import { getTray, resetTrayStatus } from '../../apps/main/tray/tray-setup';
import { openOnboardingWindow } from '../../apps/main/windows/onboarding';
import { getTheme } from '../theme';
import { getAntivirusManager } from '../../apps/main/antivirus/antivirusManager';
import { trySetupAntivirusIpcAndInitialize } from '../../apps/main/background-processes/antivirus/try-setup-antivirus-ipc-and-initialize';
import { getUserAvailableProductsAndStore } from '../../backend/features/payments/services/get-user-available-products-and-store';
import { registerBackupHandlers } from '../../backend/features/backup/register-backup-handlers';
import { startBackupsIfAvailable } from '../../backend/features/backup/start-backups-if-available';
import { stopVirtualDriveOnce } from '../../backend/features/virtual-drive/services/drive-folder/virtual-drive.service';
import { resolveUserFileSizeLimit } from '../../backend/features/user/file-size-limit/resolve-user-file-size-limit';
import { uninstallNautilusExtension } from '../../backend/features/nautilus-extension/uninstall';
import { showMarketingNotifications } from '../../backend/features/marketing';

function onWidgetIsReady() {
  registerBackupHandlers();
  startBackupsIfAvailable();
}

async function onUserLoggedIn() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      eventBus.emit('APP_DATA_SOURCE_INITIALIZED');
    }

    getAuthWindow()?.hide();

    getTheme();

    resetTrayStatus('IDLE');
    const widget = await getOrCreateWidged();
    const tray = getTray();
    if (widget && tray) {
      setBoundsOfWidgetByPath(widget, tray);
    }

    setTimeout(() => {
      const authWin = getAuthWindow();
      if (authWin && !authWin.isDestroyed()) {
        authWin.destroy();
      }
    }, 300);

    const lastOnboardingShown = configStore.get('lastOnboardingShown');

    if (!lastOnboardingShown) {
      openOnboardingWindow();
    } else if (widget) {
      widget.show();
    }
    await resolveUserFileSizeLimit();
    await getUserAvailableProductsAndStore();
    await trySetupAntivirusIpcAndInitialize();
    void showMarketingNotifications();
  } catch (error) {
    logger.error({
      msg: 'Error on main process while handling USER_LOGGED_IN event:',
      error,
    });
  }
}

async function onUserLoggedOut() {
  resetTrayStatus('IDLE');
  const widget = getWidget();

  if (widget) {
    widget.hide();

    void getAntivirusManager().shutdown();
  }

  await createAuthWindow();

  if (widget) {
    widget.destroy();
  }
  await stopVirtualDriveOnce();
  await resetAppDataSourceOnLogout();

  await uninstallNautilusExtension();
}

export function registerSessionEventHandlers() {
  eventBus.on('WIDGET_IS_READY', onWidgetIsReady);
  eventBus.on('USER_LOGGED_IN', onUserLoggedIn);
  eventBus.on('USER_LOGGED_OUT', onUserLoggedOut);
}

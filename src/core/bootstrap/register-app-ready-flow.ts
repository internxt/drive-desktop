import { app } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import eventBus from '../../apps/main/event-bus';
import { getIsLoggedIn } from '../../apps/main/auth/handlers';
import { createAuthWindow } from '../../apps/main/windows/auth';
import { setupTrayIcon, resetTrayStatus } from '../../apps/main/tray/tray-setup';
import { broadcastToWindows } from '../../apps/main/windows';
import { setupThemeListener } from '../theme';
import { registerAvailableUserProductsHandlers } from '../../backend/features/payments/ipc/register-available-user-products-handlers';
import { setupAppImageDeeplink } from '../../apps/main/auth/deeplink/setup-appimage-deeplink';
import { INTERNXT_VERSION } from '../utils/utils';
import { checkForUpdates } from '../../apps/main/auto-update/check-for-updates';
import { setPendingUpdateInfo } from './bootstrap-runtime-state';
import { installNautilusExtension } from '../../backend/features/nautilus-extension/install';
import { setupMainI18n } from '../../apps/main/localize/i18n.service';
import { getLanguage } from '../../apps/main/config/language';

export function registerAppReadyFlow() {
  app
    .whenReady()
    .then(async () => {
      /**
       * v.2.5.1
       * Esteban Galvis Triana
       * .AppImage users may experience login issues because the deeplink protocol
       * is not registered automatically, unlike with .deb packages.
       * This function manually registers the protocol handler for .AppImage installations.
       */
      await setupAppImageDeeplink();
      await installNautilusExtension();
      await setupMainI18n({ language: getLanguage() });
      setupThemeListener();
      setupTrayIcon();

      eventBus.emit('APP_IS_READY');
      const isLoggedIn = getIsLoggedIn();

      if (!isLoggedIn) {
        await createAuthWindow();
        resetTrayStatus('IDLE');
      }

      await checkForUpdates({
        currentVersion: INTERNXT_VERSION,
        onUpdateAvailable: (updateInfo) => {
          setPendingUpdateInfo(updateInfo);
          broadcastToWindows('update-available', updateInfo);
        },
      });
      registerAvailableUserProductsHandlers();
    })
    .catch((exc) => logger.error({ msg: 'Error starting app', exc }));
}

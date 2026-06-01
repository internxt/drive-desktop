import { app, ipcMain } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { stopVirtualDrive } from '../../backend/features/virtual-drive/services/virtual-drive.service';

export function registerQuitHandler() {
  let isQuitting = false;

  const cleanupAndQuit = async () => {
    if (isQuitting) {
      return;
    }

    isQuitting = true;
    logger.debug({ msg: '[APP] quitting, stopping virtual drive...' });
    await stopVirtualDrive();
    logger.debug({ msg: '[APP] virtual drive stopped, quitting' });
    app.quit();
  };

  ipcMain.on('user-quit', cleanupAndQuit);

  app.on('before-quit', (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    void cleanupAndQuit();
  });
}

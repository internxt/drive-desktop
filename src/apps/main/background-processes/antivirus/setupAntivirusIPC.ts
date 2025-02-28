import { AntivirusIPCHandler } from '../../../antivirus/ipc/AntivirusIPCHandler';
import Logger from 'electron-log';

/**
 * Setup all antivirus IPC handlers to ensure window.electron.antivirus works correctly
 *
 * This function sets up handlers for both our typed AntivirusIPCMain and the raw ipcMain
 * interface to ensure full compatibility with window.electron.antivirus in the renderer.
 *
 * @returns Object with method to remove all handlers
 */
export function setupAntivirusIpc() {
  Logger.info(
    '[Antivirus] Setting up IPC handlers for window.electron.antivirus interface'
  );

  try {
    const handler = new AntivirusIPCHandler();

    handler.setupHandlers();

    Logger.info('[Antivirus] IPC handlers registered successfully');

    return {
      removeMessagesHandlers: () => {
        Logger.info('[Antivirus] Removing IPC handlers');
        try {
          handler.removeHandlers();
        } catch (error) {
          Logger.error('[Antivirus] Error removing handlers:', error);
        }
      },
    };
  } catch (error) {
    Logger.error('[Antivirus] Error setting up IPC handlers:', error);

    return {
      removeMessagesHandlers: () => {
        Logger.warn('[Antivirus] No handlers to remove due to setup error');
      },
    };
  }
}

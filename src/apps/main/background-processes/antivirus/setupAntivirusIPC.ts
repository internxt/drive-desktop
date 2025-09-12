import { AntivirusIPCHandler } from '../../../antivirus/ipc/AntivirusIPCHandler';
import { logger } from '@internxt/drive-desktop-core/build/backend';

/**
 * Setup all antivirus IPC handlers to ensure window.electron.antivirus works correctly
 *
 * This function sets up handlers for both our typed AntivirusIPCMain and the raw ipcMain
 * interface to ensure full compatibility with window.electron.antivirus in the renderer.
 *
 * @returns Object with method to remove all handlers
 */
export function setupAntivirusIpc() {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Setting up IPC handlers for window.electron.antivirus interface'
  });

  try {
    const handler = new AntivirusIPCHandler();

    handler.setupHandlers();

    logger.debug({ tag: 'ANTIVIRUS', msg: 'IPC handlers registered successfully' });

    return {
      removeMessagesHandlers: () => {
        logger.debug({ tag: 'ANTIVIRUS', msg: 'Removing IPC handlers' });
        try {
          handler.removeHandlers();
        } catch (error) {
          logger.error({ tag: 'ANTIVIRUS', msg: 'Error removing handlers:', error });
        }
      },
    };
  } catch (error) {
    logger.error({ tag: 'ANTIVIRUS', msg: 'Error setting up IPC handlers:', error });

    return {
      removeMessagesHandlers: () => {
        logger.warn({ tag: 'ANTIVIRUS', msg: 'No handlers to remove due to setup error' });
      },
    };
  }
}

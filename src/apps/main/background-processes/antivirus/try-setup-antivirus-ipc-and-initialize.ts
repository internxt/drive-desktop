import { logger } from '@internxt/drive-desktop-core/build/backend';
import { setupAntivirusIpc } from './setupAntivirusIPC';
import { getAntivirusManager } from '../../antivirus/antivirusManager';

export async function trySetupAntivirusIpcAndInitialize() {
    try {
    logger.debug({ tag: 'ANTIVIRUS', msg: '[Main] Setting up antivirus IPC handlers'});
    setupAntivirusIpc();
    logger.debug({ msg: '[Main] Antivirus IPC handlers setup complete'});
    await getAntivirusManager().initialize();
  } catch (error) {
    logger.error({ tag: 'ANTIVIRUS', msg: '[Main] Error setting up antivirus:', error });
  }
}

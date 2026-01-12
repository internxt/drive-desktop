import { ipcRenderer } from 'electron';
import { BackupsDependencyContainerFactory } from './dependency-injection/BackupsDependencyContainerFactory';
import { logger } from '@internxt/drive-desktop-core/build/backend';

async function reinitializeBackups() {
  await BackupsDependencyContainerFactory.reinitialize();
  logger.debug({ tag: 'BACKUPS', msg: 'Reinitialized' });
}

ipcRenderer.on('reinitialize-backups', async () => {
  await reinitializeBackups();
});

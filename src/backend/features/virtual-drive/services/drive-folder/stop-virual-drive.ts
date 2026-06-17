import { logger } from '@internxt/drive-desktop-core/build/backend';
import { stopDaemon } from '../daemon.service';
import { stopFuseDaemonServer } from '../server.service';
import { abortAllHydrations, clearHydrationState } from '../../../fuse/on-read/download-cache/hydration-state';
import { StorageFilesRepository } from '../../../../../context/storage/StorageFiles/domain/StorageFilesRepository';
import { Container } from 'diod';
import { stopHydrationApi } from '../hydration-api.service';

export async function stopVirtualDrive({ container }: { container?: Container }) {
  logger.debug({ msg: '[VIRTUAL DRIVE] stopping daemon...' });
  abortAllHydrations();
  await stopDaemon();
  logger.debug({ msg: '[VIRTUAL DRIVE] clearing storage cache...' });
  clearHydrationState();
  if (container) {
    await container.get(StorageFilesRepository).deleteAll();
  }
  logger.debug({ msg: '[VIRTUAL DRIVE] stopping server...' });
  await stopHydrationApi();
  await stopFuseDaemonServer();
  logger.debug({ msg: '[VIRTUAL DRIVE] stopped' });
}
